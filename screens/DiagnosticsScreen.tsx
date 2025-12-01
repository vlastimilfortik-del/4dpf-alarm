import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, {
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { CircularProgress } from "@/components/CircularProgress";
import { Button } from "@/components/Button";
import { DPFAlertOverlay } from "@/components/DPFAlertOverlay";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { storage, DPFHistoryEntry } from "@/utils/storage";
import { getVehicleBrand } from "@/constants/vehicles";
import { playDPFAlertSound } from "@/utils/sound";

type RegenerationStatus = "idle" | "running" | "completed" | "stopped";

export default function DiagnosticsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  
  const [status, setStatus] = useState<RegenerationStatus>("idle");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [temperature, setTemperature] = useState(200);
  const [showAlert, setShowAlert] = useState(false);
  
  const progress = useSharedValue(0);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastHapticRef = useRef<number>(0);

  const loadSettings = useCallback(async () => {
    try {
      const [vehicle, sound] = await Promise.all([
        storage.getSelectedVehicle(),
        storage.getSoundEnabled(),
      ]);
      setSelectedVehicle(vehicle);
      setSoundEnabled(sound);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [loadSettings])
  );

  const triggerHaptic = useCallback((milestone: number) => {
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(
          milestone === 100
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Medium
        );
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, []);

  const saveHistoryEntry = useCallback(async (entry: DPFHistoryEntry) => {
    try {
      await storage.addDPFHistoryEntry(entry);
    } catch (error) {
      console.error("Failed to save history entry:", error);
    }
  }, []);

  const handleComplete = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setStatus("completed");
    setShowAlert(false);
    
    const entry: DPFHistoryEntry = {
      id: Date.now().toString(),
      brand: selectedVehicle || "unknown",
      startTime: startTimeRef.current,
      endTime: Date.now(),
      progress: 100,
      completed: true,
    };
    
    await saveHistoryEntry(entry);
    
    if (Platform.OS !== "web") {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, [selectedVehicle, saveHistoryEntry]);

  const updateProgress = useCallback(() => {
    const currentProgress = Math.min(progress.value + 0.5, 100);
    progress.value = currentProgress;
    
    const newTemp = 200 + Math.floor((currentProgress / 100) * 400);
    runOnJS(setTemperature)(newTemp);
    
    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (currentProgress >= milestone && lastHapticRef.current < milestone) {
        lastHapticRef.current = milestone;
        runOnJS(triggerHaptic)(milestone);
      }
    }
    
    if (currentProgress >= 100) {
      runOnJS(handleComplete)();
    }
  }, [progress, triggerHaptic, handleComplete]);

  const startRegeneration = useCallback(() => {
    if (!selectedVehicle) return;
    
    setStatus("running");
    setShowAlert(true);
    progress.value = 0;
    lastHapticRef.current = 0;
    startTimeRef.current = Date.now();
    setTemperature(200);
    
    playDPFAlertSound();
    
    if (Platform.OS !== "web") {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
    
    intervalRef.current = setInterval(() => {
      updateProgress();
    }, 100);
  }, [selectedVehicle, progress, updateProgress]);

  const stopRegeneration = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const finalProgress = progress.value;
    setStatus("stopped");
    setShowAlert(false);
    
    if (Platform.OS !== "web") {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
    
    const entry: DPFHistoryEntry = {
      id: Date.now().toString(),
      brand: selectedVehicle || "unknown",
      startTime: startTimeRef.current,
      endTime: Date.now(),
      progress: finalProgress,
      completed: false,
    };
    
    await saveHistoryEntry(entry);
    
    setTimeout(() => {
      setStatus("idle");
      progress.value = 0;
      setTemperature(200);
    }, 2000);
  }, [selectedVehicle, progress, saveHistoryEntry]);

  const resetRegeneration = useCallback(() => {
    setStatus("idle");
    setShowAlert(false);
    progress.value = 0;
    setTemperature(200);
    lastHapticRef.current = 0;
    
    if (Platform.OS !== "web") {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, [progress]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const toggleSound = useCallback(async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    
    try {
      await storage.setSoundEnabled(newValue);
    } catch (error) {
      console.error("Failed to save sound setting:", error);
    }
    
    if (Platform.OS !== "web") {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, [soundEnabled]);

  const vehicleBrand = selectedVehicle ? getVehicleBrand(selectedVehicle) : null;
  const progressColor = status === "completed" 
    ? Colors.dark.success 
    : status === "stopped" 
    ? Colors.dark.error 
    : status === "running"
    ? Colors.dark.alertRed
    : Colors.dark.primary;

  const getStatusText = () => {
    switch (status) {
      case "running":
        return "REGENERACE AKTIVN\u00CD";
      case "completed":
        return "REGENERACE DOKON\u010CENA";
      case "stopped":
        return "REGENERACE ZASTAVENA";
      default:
        return selectedVehicle ? "P\u0158IPRAVENO" : "VYBERTE VOZIDLO";
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
    >
      <DPFAlertOverlay 
        visible={showAlert} 
        onDismiss={() => setShowAlert(false)} 
      />

      <Pressable
        onPress={toggleSound}
        style={({ pressed }) => [
          styles.soundToggle,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Feather
          name={soundEnabled ? "volume-2" : "volume-x"}
          size={24}
          color={soundEnabled ? Colors.dark.primary : Colors.dark.neutral}
        />
      </Pressable>

      <View style={styles.content}>
        {vehicleBrand ? (
          <View style={[styles.vehicleBadge, { backgroundColor: Colors.dark.primary + "20" }]}>
            <Feather name="truck" size={16} color={Colors.dark.primary} />
            <ThemedText type="small" style={{ color: Colors.dark.primary, marginLeft: Spacing.xs }}>
              {vehicleBrand.name}
            </ThemedText>
          </View>
        ) : null}

        <CircularProgress
          progress={progress}
          size={220}
          strokeWidth={12}
          progressColor={progressColor}
          backgroundColor={Colors.dark.cardBackground}
        />

        <View style={styles.temperatureContainer}>
          <Feather name="thermometer" size={20} color={Colors.dark.warning} />
          <ThemedText type="data" style={styles.temperatureText}>
            {temperature}
          </ThemedText>
          <ThemedText type="small" color="secondary">
            C
          </ThemedText>
        </View>

        <ThemedText
          type="body"
          color={status === "completed" ? "success" : status === "stopped" ? "error" : status === "running" ? "error" : "secondary"}
          style={styles.statusText}
        >
          {getStatusText()}
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        {status === "idle" ? (
          <Button
            onPress={startRegeneration}
            disabled={!selectedVehicle}
            icon="play"
          >
            SPUSTIT REGENERACI
          </Button>
        ) : status === "running" ? (
          <Button onPress={stopRegeneration} variant="destructive" icon="square">
            ZASTAVIT REGENERACI
          </Button>
        ) : (
          <Button onPress={resetRegeneration} variant="secondary" icon="refresh-cw">
            NOV{"\u00C1"} REGENERACE
          </Button>
        )}
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
  soundToggle: {
    position: "absolute",
    top: Spacing.xl,
    right: Spacing.xl,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing["2xl"],
  },
  temperatureContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: Spacing["2xl"],
  },
  temperatureText: {
    color: Colors.dark.warning,
    marginLeft: Spacing.sm,
  },
  statusText: {
    marginTop: Spacing.lg,
    textAlign: "center",
    letterSpacing: 1,
  },
  buttonContainer: {
    paddingBottom: Spacing.xl,
  },
});
