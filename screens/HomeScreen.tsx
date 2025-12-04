import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, Platform, Pressable, Linking, Alert, Modal, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Device } from "react-native-ble-plx";

import { ThemedText } from "@/components/ThemedText";
import { DPFAlertOverlay } from "@/components/DPFAlertOverlay";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { playDPFAlertSound } from "@/utils/sound";
import dpfMonitor, { type MonitoringState } from "@/services/obd/DPFMonitor";
import { type DPFData } from "@/services/obd/VAGProtocol";

const appIcon = require("@/assets/images/icon.png");

const VAG_BRANDS_ROW1 = ["Volkswagen", "Audi", "Škoda"];
const VAG_BRANDS_ROW2 = ["Seat", "Cupra"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [monitoringState, setMonitoringState] = useState<MonitoringState>('idle');
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [foundDevices, setFoundDevices] = useState<Device[]>([]);
  const [dpfData, setDpfData] = useState<DPFData | null>(null);
  
  const soundPlayedRef = useRef(false);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const loadSettings = useCallback(async () => {
    try {
      const sound = await storage.getSoundEnabled();
      setSoundEnabled(sound);
      soundEnabledRef.current = sound;
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    dpfMonitor.setCallbacks({
      onStateChange: (state: MonitoringState) => {
        setMonitoringState(state);
        if (state === 'monitoring') {
          setIsMonitoring(true);
        } else if (state === 'idle' || state === 'error') {
          setIsMonitoring(false);
        }
      },
      onConnectionChange: (connected: boolean) => {
        setIsConnected(connected);
        if (!connected) {
          setIsMonitoring(false);
          setShowAlert(false);
          setIsRegenerating(false);
        }
      },
      onDPFDataUpdate: (data: DPFData) => {
        setDpfData(data);
      },
      onRegenerationStart: () => {
        setIsRegenerating(true);
        setShowAlert(true);
        
        if (soundEnabledRef.current && !soundPlayedRef.current) {
          playDPFAlertSound();
          soundPlayedRef.current = true;
        }
        
        triggerHaptic('warning');
      },
      onRegenerationEnd: () => {
        setIsRegenerating(false);
        setShowAlert(false);
        soundPlayedRef.current = false;
        triggerHaptic('success');
      },
      onDeviceFound: (device: Device) => {
        setFoundDevices((prev) => {
          const exists = prev.some((d) => d.id === device.id);
          if (exists) return prev;
          return [...prev, device];
        });
      },
      onError: (error: string) => {
        Alert.alert("Chyba", error);
      },
    });

    return () => {
      dpfMonitor.destroy();
    };
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'warning' | 'success' = 'light') => {
    if (Platform.OS !== "web") {
      try {
        if (type === 'warning') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'medium') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.selectionAsync();
        }
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, []);

  const handleSoundToggle = useCallback(async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    soundEnabledRef.current = newValue;
    triggerHaptic('light');
    try {
      await storage.setSoundEnabled(newValue);
    } catch (error) {
      console.error("Failed to save sound setting:", error);
    }
  }, [soundEnabled, triggerHaptic]);

  const handleBluetoothPress = useCallback(() => {
    triggerHaptic('light');
    if (Platform.OS === "web") {
      Alert.alert(
        "Bluetooth",
        "Pro připojení k OBD-II adaptéru spusťte aplikaci v Expo Go nebo nainstalovanou verzi na vašem telefonu."
      );
    } else {
      try {
        Linking.openSettings();
      } catch (error) {
        Alert.alert("Chyba", "Nelze otevřít nastavení Bluetooth");
      }
    }
  }, [triggerHaptic]);

  const handleScanDevices = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Bluetooth",
        "Bluetooth není dostupný na webu. Použijte nainstalovanou aplikaci."
      );
      return;
    }

    triggerHaptic('medium');
    setFoundDevices([]);
    setShowDeviceList(true);
    await dpfMonitor.scanForDevices();
  }, [triggerHaptic]);

  const handleSelectDevice = useCallback(async (device: Device) => {
    setShowDeviceList(false);
    triggerHaptic('medium');
    
    const connected = await dpfMonitor.connectToDevice(device);
    if (connected) {
      Alert.alert("Připojeno", `Připojeno k ${device.name || 'OBD-II adaptér'}`);
    }
  }, [triggerHaptic]);

  const startMonitoring = useCallback(async () => {
    triggerHaptic('medium');
    soundPlayedRef.current = false;

    if (!isConnected) {
      handleScanDevices();
      return;
    }

    const started = await dpfMonitor.startMonitoring();
    if (!started) {
      Alert.alert("Chyba", "Nepodařilo se spustit monitorování");
    }
  }, [isConnected, handleScanDevices, triggerHaptic]);

  const stopMonitoring = useCallback(() => {
    dpfMonitor.stopMonitoring();
    setShowAlert(false);
    setIsRegenerating(false);
    soundPlayedRef.current = false;
    triggerHaptic('light');
  }, [triggerHaptic]);

  const getStatusText = (): string => {
    switch (monitoringState) {
      case 'connecting':
        return 'PŘIPOJOVÁNÍ...';
      case 'initializing':
        return 'INICIALIZACE...';
      case 'monitoring':
        return 'PŘIPOJENO';
      case 'error':
        return 'CHYBA';
      default:
        return isConnected ? 'PŘIPOJENO' : 'ODPOJENO';
    }
  };

  const getSubtitleText = (): string => {
    if (monitoringState === 'monitoring' && dpfData) {
      return `DPF: ${dpfData.sootLoadPercent.toFixed(0)}% naplnění`;
    }
    if (monitoringState === 'connecting') {
      return 'Hledání OBD-II adaptéru...';
    }
    if (monitoringState === 'initializing') {
      return 'Inicializace ELM327...';
    }
    return 'OBD-II adaptér';
  };

  const renderDeviceItem = ({ item }: { item: Device }) => (
    <Pressable
      onPress={() => handleSelectDevice(item)}
      style={({ pressed }) => [
        styles.deviceItem,
        { opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <Feather name="bluetooth" size={20} color={Colors.dark.primary} />
      <View style={styles.deviceInfo}>
        <ThemedText type="body" style={styles.deviceName}>
          {item.name || 'Neznámé zařízení'}
        </ThemedText>
        <ThemedText type="small" color="secondary">
          {item.id}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={Colors.dark.secondaryText} />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <DPFAlertOverlay 
        visible={showAlert} 
        onDismiss={() => setShowAlert(false)} 
      />

      <Modal
        visible={showDeviceList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeviceList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">OBD-II adaptéry</ThemedText>
              <Pressable onPress={() => setShowDeviceList(false)}>
                <Feather name="x" size={24} color={Colors.dark.text} />
              </Pressable>
            </View>
            
            {foundDevices.length === 0 ? (
              <View style={styles.emptyList}>
                <Feather name="search" size={48} color={Colors.dark.secondaryText} />
                <ThemedText type="body" color="secondary" style={styles.emptyText}>
                  {monitoringState === 'connecting' 
                    ? 'Hledání OBD-II adaptérů...'
                    : 'Žádné adaptéry nenalezeny'}
                </ThemedText>
                <ThemedText type="small" color="secondary" style={styles.emptyHint}>
                  Ujistěte se, že je adaptér zapojený a Bluetooth zapnutý
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={foundDevices}
                renderItem={renderDeviceItem}
                keyExtractor={(item) => item.id}
                style={styles.deviceList}
              />
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Image source={appIcon} style={styles.appIcon} contentFit="contain" />
        <ThemedText type="h3" style={styles.appTitle}>
          4 DPF Alarm
        </ThemedText>
        <View style={styles.headerButtons}>
          <Pressable
            onPress={handleSoundToggle}
            style={({ pressed }) => [
              styles.roundButton,
              {
                backgroundColor: soundEnabled ? Colors.dark.link : Colors.dark.backgroundSecondary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name={soundEnabled ? "volume-2" : "volume-x"}
              size={22}
              color={soundEnabled ? Colors.dark.buttonText : Colors.dark.secondaryText}
            />
          </Pressable>
          <Pressable
            onPress={handleBluetoothPress}
            style={({ pressed }) => [
              styles.roundButton,
              styles.settingsButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="settings" size={22} color={Colors.dark.link} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <Card 
          elevation={1} 
          style={[
            styles.statusCard,
            isConnected ? { backgroundColor: Colors.dark.primary } : null
          ]}
          onPress={isConnected ? undefined : handleScanDevices}
        >
          <View style={styles.statusContent}>
            <Feather 
              name="bluetooth" 
              size={20} 
              color={isConnected ? Colors.dark.text : Colors.dark.secondaryText}
              style={styles.bluetoothIcon}
            />
            <ThemedText 
              type="body" 
              style={[
                styles.statusTitle,
                isConnected ? { color: Colors.dark.text } : { color: Colors.dark.secondaryText }
              ]}
            >
              {getStatusText()}
            </ThemedText>
            <ThemedText 
              type="small" 
              style={[
                styles.statusSubtitle,
                isConnected ? { color: "rgba(255,255,255,0.8)" } : { color: Colors.dark.secondaryText }
              ]}
            >
              {getSubtitleText()}
            </ThemedText>
          </View>
        </Card>

        {isRegenerating ? (
          <View style={styles.regenStatus}>
            <Feather name="zap" size={24} color={Colors.dark.alertRed} />
            <ThemedText type="body" style={styles.regenText}>
              REGENERACE DPF PROBÍHÁ
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.brandsSection}>
          <ThemedText type="small" color="secondary" style={styles.brandsLabel}>
            Podporované značky
          </ThemedText>
          <Card elevation={1} style={styles.brandsCard}>
            <View style={styles.brandsRow}>
              {VAG_BRANDS_ROW1.map((brand) => (
                <ThemedText key={brand} type="body" style={styles.brandName}>
                  {brand}
                </ThemedText>
              ))}
            </View>
            <View style={styles.brandsRow}>
              {VAG_BRANDS_ROW2.map((brand) => (
                <ThemedText key={brand} type="body" style={styles.brandName}>
                  {brand}
                </ThemedText>
              ))}
            </View>
          </Card>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={isMonitoring ? stopMonitoring : startMonitoring}
          disabled={monitoringState === 'connecting' || monitoringState === 'initializing'}
          style={({ pressed }) => [
            styles.mainButton,
            {
              backgroundColor: isMonitoring ? Colors.dark.error : Colors.dark.success,
              opacity: (monitoringState === 'connecting' || monitoringState === 'initializing') 
                ? 0.6 
                : pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Feather
            name={isMonitoring ? "stop-circle" : "play-circle"}
            size={28}
            color={Colors.dark.buttonText}
          />
          <ThemedText type="h4" style={styles.mainButtonText}>
            {isMonitoring ? "ZASTAVIT" : "SPUSTIT"}
          </ThemedText>
        </Pressable>

        <ThemedText type="caption" color="secondary" style={styles.versionText}>
          Verze 1.0.0
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  appTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusContent: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  bluetoothIcon: {
    marginBottom: Spacing.xs,
  },
  statusTitle: {
    fontWeight: "600",
    textAlign: "center",
  },
  statusSubtitle: {
    textAlign: "center",
    marginTop: 2,
  },
  regenStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.alertRed + "20",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  regenText: {
    marginLeft: Spacing.sm,
    color: Colors.dark.alertRed,
    fontWeight: "600",
  },
  brandsSection: {
    marginTop: Spacing.lg,
  },
  brandsLabel: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  brandsCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  brandsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: Spacing.xs,
  },
  brandName: {
    color: Colors.dark.secondaryText,
    fontSize: 16,
    marginHorizontal: Spacing.md,
    opacity: 0.8,
  },
  footer: {
    alignItems: "center",
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  mainButtonText: {
    marginLeft: Spacing.md,
    color: Colors.dark.buttonText,
  },
  versionText: {
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.dark.backgroundRoot,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  deviceList: {
    paddingHorizontal: Spacing.xl,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  deviceName: {
    fontWeight: "500",
  },
  emptyList: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptyHint: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
