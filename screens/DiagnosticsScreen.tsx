import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { CircularProgress } from "@/components/CircularProgress";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { storage, DPFHistoryEntry } from "@/utils/storage";
import { getVehicleBrand } from "@/constants/vehicles";
import { playNotificationSound } from "@/utils/sound";

type RegenerationStatus = "idle" | "running" | "completed" | "stopped";

export default function DiagnosticsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  const [status, setStatus] = useState<RegenerationStatus>("idle");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [temperature, setTemperature] = useState(200);
  
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
    if (milestone === 50) {
      playNotificationSound("progress");
    }
    
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
    
    const entry: DPFHistoryEntry = {
      id: Date.now().toString(),
      brand: selectedVehicle || "unknown",
      startTime: startTimeRef.current,
      endTime: Date.now(),
      progress: 100,
      completed: true,
    };
    
    await saveHistoryEntry(entry);
    
    playNotificationSound("complete");
    
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
    progress.value = 0;
    lastHapticRef.current = 0;
    startTimeRef.current = Date.now();
    setTemperature(200);
    
    playNotificationSound("start");
    
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    
    playNotificationSound("error");
    
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
    : vehicleBrand?.color || Colors.dark.link;

  const getStatusText = () => {
    switch (status) {
      case "running":
        return "Regeneration in Progress...";
      case "completed":
        return "Regeneration Complete!";
      case "stopped":
        return "Regeneration Stopped";
      default:
        return selectedVehicle ? "Ready to Start" : "Select a Vehicle First";
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
          color={soundEnabled ? Colors.dark.link : Colors.dark.neutral}
        />
      </Pressable>

      <View style={styles.content}>
        {vehicleBrand ? (
          <View style={[styles.vehicleBadge, { backgroundColor: vehicleBrand.color + "20" }]}>
            <Feather name="truck" size={16} color={vehicleBrand.color} />
            <ThemedText type="small" style={{ color: vehicleBrand.color, marginLeft: Spacing.xs }}>
              {vehicleBrand.name}
            </ThemedText>
          </View>
        ) : null}

        <CircularProgress
          progress={progress}
          size={220}
          strokeWidth={12}
          progressColor={progressColor}
          backgroundColor={Colors.dark.backgroundDefault}
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
          color={status === "completed" ? "success" : status === "stopped" ? "error" : "secondary"}
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
            Start Regeneration
          </Button>
        ) : status === "running" ? (
          <Button onPress={stopRegeneration} variant="destructive" icon="square">
            Stop Regeneration
          </Button>
        ) : (
          <Button onPress={resetRegeneration} variant="secondary" icon="refresh-cw">
            New Regeneration
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
  },
  buttonContainer: {
    paddingBottom: Spacing.xl,
  },
});
