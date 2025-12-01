import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { storage, BluetoothDevice } from "@/utils/storage";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";

type BluetoothPairingScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "BluetoothPairing">;
};

const MOCK_DEVICES: BluetoothDevice[] = [
  { id: "1", name: "OBD-II Adapter", connected: false },
  { id: "2", name: "ELM327 v2.1", connected: false },
  { id: "3", name: "VAG-COM Pro", connected: false },
];

export default function BluetoothPairingScreen({ navigation }: BluetoothPairingScreenProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [savedDevices, setSavedDevices] = useState<BluetoothDevice[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const loadSavedDevices = useCallback(async () => {
    try {
      const saved = await storage.getBluetoothDevices();
      setSavedDevices(saved);
    } catch (error) {
      console.error("Failed to load saved devices:", error);
    }
  }, []);

  useEffect(() => {
    loadSavedDevices();
  }, [loadSavedDevices]);

  const triggerHaptic = useCallback((type: "light" | "medium" | "success" | "selection") => {
    if (Platform.OS === "web") return;
    
    try {
      switch (type) {
        case "light":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "success":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "selection":
          Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      console.log("Haptics not available");
    }
  }, []);

  const startScan = useCallback(async () => {
    if (Platform.OS === "web") return;
    
    setIsScanning(true);
    setDevices([]);
    
    triggerHaptic("light");

    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setDevices(MOCK_DEVICES);
    setIsScanning(false);
  }, [triggerHaptic]);

  const connectToDevice = useCallback(async (device: BluetoothDevice) => {
    setConnectingId(device.id);
    
    triggerHaptic("medium");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const connectedDevice: BluetoothDevice = {
      ...device,
      connected: true,
      lastConnected: Date.now(),
    };

    try {
      await storage.saveBluetoothDevice(connectedDevice);
      await loadSavedDevices();
    } catch (error) {
      console.error("Failed to save device:", error);
    }
    
    setConnectingId(null);
    
    triggerHaptic("success");
  }, [loadSavedDevices, triggerHaptic]);

  const disconnectDevice = useCallback(async (device: BluetoothDevice) => {
    const disconnectedDevice: BluetoothDevice = {
      ...device,
      connected: false,
    };
    
    try {
      await storage.saveBluetoothDevice(disconnectedDevice);
      await loadSavedDevices();
    } catch (error) {
      console.error("Failed to disconnect device:", error);
    }
    
    triggerHaptic("selection");
  }, [loadSavedDevices, triggerHaptic]);

  const connectedDevice = savedDevices.find((d) => d.connected);

  return (
    <ScreenScrollView>
      {Platform.OS === "web" ? (
        <View style={styles.webNotice}>
          <Feather name="info" size={20} color={Colors.dark.warning} />
          <ThemedText type="small" color="secondary" style={styles.webNoticeText}>
            Bluetooth is not available on web. Run in Expo Go on your mobile device to use this feature.
          </ThemedText>
        </View>
      ) : null}

      {connectedDevice ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Connected Device
          </ThemedText>
          <Card elevation={1}>
            <View style={styles.deviceRow}>
              <View style={[styles.deviceIcon, styles.connectedIcon]}>
                <Feather name="bluetooth" size={20} color={Colors.dark.success} />
              </View>
              <View style={styles.deviceContent}>
                <ThemedText type="body">{connectedDevice.name}</ThemedText>
                <ThemedText type="small" color="success">
                  Connected
                </ThemedText>
              </View>
              <Pressable
                onPress={() => disconnectDevice(connectedDevice)}
                style={({ pressed }) => [
                  styles.disconnectButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <ThemedText type="small" color="error">
                  Disconnect
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Available Devices</ThemedText>
          {isScanning ? (
            <ActivityIndicator size="small" color={Colors.dark.link} />
          ) : null}
        </View>

        {devices.length > 0 ? (
          <Card elevation={1}>
            {devices.map((device, index) => {
              const isConnecting = connectingId === device.id;
              const isSaved = savedDevices.some((d) => d.id === device.id && d.connected);
              
              return (
                <Pressable
                  key={device.id}
                  onPress={() => !isSaved && !isConnecting && connectToDevice(device)}
                  disabled={isSaved || isConnecting}
                  style={({ pressed }) => [
                    styles.deviceRow,
                    index < devices.length - 1 && styles.deviceBorder,
                    { opacity: pressed && !isSaved && !isConnecting ? 0.7 : 1 },
                  ]}
                >
                  <View style={styles.deviceIcon}>
                    <Feather
                      name="bluetooth"
                      size={20}
                      color={Colors.dark.link}
                    />
                  </View>
                  <View style={styles.deviceContent}>
                    <ThemedText type="body">{device.name}</ThemedText>
                    <ThemedText type="small" color="secondary">
                      {isConnecting ? "Connecting..." : "Tap to connect"}
                    </ThemedText>
                  </View>
                  {isConnecting ? (
                    <ActivityIndicator size="small" color={Colors.dark.link} />
                  ) : (
                    <View style={styles.signalBars}>
                      <View style={[styles.signalBar, styles.signalBar1, styles.signalBarActive]} />
                      <View style={[styles.signalBar, styles.signalBar2, styles.signalBarActive]} />
                      <View style={[styles.signalBar, styles.signalBar3, styles.signalBarActive]} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </Card>
        ) : !isScanning ? (
          <Card elevation={1} style={styles.emptyCard}>
            <Feather name="search" size={32} color={Colors.dark.secondaryText} />
            <ThemedText type="body" color="secondary" style={styles.emptyText}>
              No devices found
            </ThemedText>
            <ThemedText type="small" color="secondary" style={styles.emptySubtext}>
              Tap the button below to scan for Bluetooth devices
            </ThemedText>
          </Card>
        ) : null}
      </View>

      <Button
        onPress={startScan}
        disabled={isScanning || Platform.OS === "web"}
        icon={isScanning ? undefined : "search"}
      >
        {isScanning ? "Scanning..." : "Scan for Devices"}
      </Button>
      
      {Platform.OS === "web" ? (
        <ThemedText type="caption" color="secondary" style={styles.webHint}>
          Scan your Replit QR code with Expo Go to test Bluetooth on a real device
        </ThemedText>
      ) : null}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.warning + "20",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing["2xl"],
  },
  webNoticeText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  deviceBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  connectedIcon: {
    backgroundColor: Colors.dark.success + "20",
  },
  deviceContent: {
    flex: 1,
  },
  disconnectButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  signalBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  signalBar: {
    width: 4,
    backgroundColor: Colors.dark.neutral,
    borderRadius: 2,
  },
  signalBar1: {
    height: 6,
  },
  signalBar2: {
    height: 10,
  },
  signalBar3: {
    height: 14,
  },
  signalBarActive: {
    backgroundColor: Colors.dark.success,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  webHint: {
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
