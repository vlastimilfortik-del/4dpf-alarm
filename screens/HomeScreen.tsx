import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, Platform, Pressable, Linking, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { DPFAlertOverlay } from "@/components/DPFAlertOverlay";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { playDPFAlertSound } from "@/utils/sound";

const appIcon = require("@/assets/images/icon.png");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRegeneratingRef = useRef(false);
  const soundPlayedRef = useRef(false);
  const regenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const cleanupAll = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    if (regenTimeoutRef.current) {
      clearTimeout(regenTimeoutRef.current);
      regenTimeoutRef.current = null;
    }
    setShowAlert(false);
    setIsRegenerating(false);
    isRegeneratingRef.current = false;
    soundPlayedRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

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
        "Pro připojení k OBD-II adaptéru spusťte aplikaci v Expo Go na vašem telefonu."
      );
    } else {
      try {
        Linking.openSettings();
      } catch (error) {
        Alert.alert("Chyba", "Nelze otevřít nastavení Bluetooth");
      }
    }
  }, [triggerHaptic]);

  const simulateRegeneration = useCallback(() => {
    if (isRegeneratingRef.current) return;
    
    isRegeneratingRef.current = true;
    setIsRegenerating(true);
    setShowAlert(true);
    
    if (soundEnabledRef.current && !soundPlayedRef.current) {
      playDPFAlertSound();
      soundPlayedRef.current = true;
    }
    
    triggerHaptic('warning');
    
    regenTimeoutRef.current = setTimeout(() => {
      isRegeneratingRef.current = false;
      soundPlayedRef.current = false;
      setIsRegenerating(false);
      setShowAlert(false);
      triggerHaptic('success');
    }, 15000);
  }, [triggerHaptic]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    setIsConnected(true);
    soundPlayedRef.current = false;
    triggerHaptic('medium');
    
    monitoringIntervalRef.current = setInterval(() => {
      const random = Math.random();
      if (random < 0.08 && !isRegeneratingRef.current) {
        simulateRegeneration();
      }
    }, 3000);
  }, [simulateRegeneration, triggerHaptic]);

  const stopMonitoring = useCallback(() => {
    cleanupAll();
    setIsMonitoring(false);
    setIsConnected(false);
    triggerHaptic('light');
  }, [cleanupAll, triggerHaptic]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <DPFAlertOverlay 
        visible={showAlert} 
        onDismiss={() => setShowAlert(false)} 
      />

      <View style={styles.header}>
        <Image source={appIcon} style={styles.appIcon} contentFit="contain" />
        <ThemedText type="h3" style={styles.appTitle}>
          4 DPF Alarm
        </ThemedText>
      </View>

      <View style={styles.content}>
        <Pressable
          onPress={handleSoundToggle}
          style={({ pressed }) => [
            styles.soundButton,
            {
              backgroundColor: soundEnabled ? Colors.dark.link : Colors.dark.cardBackground,
              borderColor: soundEnabled ? Colors.dark.link : Colors.dark.cardBorder,
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Feather
            name={soundEnabled ? "volume-2" : "volume-x"}
            size={48}
            color={soundEnabled ? Colors.dark.buttonText : Colors.dark.secondaryText}
          />
          <ThemedText 
            type="body" 
            style={[
              styles.soundLabel,
              { color: soundEnabled ? Colors.dark.buttonText : Colors.dark.secondaryText }
            ]}
          >
            {soundEnabled ? "ZVUK ZAPNUTÝ" : "ZVUK VYPNUTÝ"}
          </ThemedText>
        </Pressable>

        <Card elevation={1} style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? Colors.dark.success : Colors.dark.error },
                ]}
              />
              <View>
                <ThemedText type="body">
                  {isConnected ? "PŘIPOJENO" : "ODPOJENO"}
                </ThemedText>
                <ThemedText type="small" color="secondary">
                  {isMonitoring ? "Monitorování aktivní" : "OBD-II adaptér"}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={handleBluetoothPress}
              style={({ pressed }) => [
                styles.bluetoothButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="bluetooth" size={22} color={Colors.dark.link} />
            </Pressable>
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
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={isMonitoring ? stopMonitoring : startMonitoring}
          style={({ pressed }) => [
            styles.mainButton,
            {
              backgroundColor: isMonitoring ? Colors.dark.error : Colors.dark.success,
              opacity: pressed ? 0.9 : 1,
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
    marginBottom: Spacing["3xl"],
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  appTitle: {
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  soundButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing["2xl"],
  },
  soundLabel: {
    marginTop: Spacing.md,
    fontWeight: "600",
    letterSpacing: 1,
  },
  statusCard: {
    marginBottom: Spacing.xl,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  bluetoothButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  regenStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.alertRed + "20",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  regenText: {
    marginLeft: Spacing.sm,
    color: Colors.dark.alertRed,
    fontWeight: "600",
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
});
