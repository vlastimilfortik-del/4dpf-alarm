import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { BrandButton } from "@/components/BrandButton";
import { Button } from "@/components/Button";
import { DPFAlertOverlay } from "@/components/DPFAlertOverlay";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { playDPFAlertSound } from "@/utils/sound";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

const appIcon = require("@/assets/images/icon.png");

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "Home">,
  BottomTabNavigationProp<MainTabParamList>
>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

const BRANDS = [
  { id: "vw", name: "VW" },
  { id: "audi", name: "Audi" },
  { id: "skoda", name: "\u0160koda" },
  { id: "seat", name: "Seat" },
  { id: "cupra", name: "Cupra" },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("\u017D\u00C1DN\u00C1 DATA");
  
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRegeneratingRef = useRef(false);
  const soundPlayedRef = useRef(false);
  const regenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const vehicle = await storage.getSelectedVehicle();
      setSelectedVehicle(vehicle);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {
        cleanupAll();
      };
    }, [loadData, cleanupAll])
  );

  const handleSelectVehicle = useCallback(async (brandId: string) => {
    setSelectedVehicle(brandId);
    
    try {
      await storage.setSelectedVehicle(brandId);
    } catch (error) {
      console.error("Failed to save vehicle:", error);
    }
  }, []);

  const simulateRegeneration = useCallback(() => {
    if (isRegeneratingRef.current) return;
    
    isRegeneratingRef.current = true;
    setIsRegenerating(true);
    setShowAlert(true);
    setCurrentStatus("REGENERACE AKTIVN\u00CD");
    
    if (!soundPlayedRef.current) {
      playDPFAlertSound();
      soundPlayedRef.current = true;
    }
    
    if (Platform.OS !== "web") {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
    
    regenTimeoutRef.current = setTimeout(() => {
      isRegeneratingRef.current = false;
      soundPlayedRef.current = false;
      setIsRegenerating(false);
      setShowAlert(false);
      setCurrentStatus("REGENERACE DOKON\u010CENA");
      
      if (Platform.OS !== "web") {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.log("Haptics not available");
        }
      }
    }, 10000);
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    setIsConnected(true);
    setCurrentStatus("MONITOROV\u00C1N\u00CD...");
    soundPlayedRef.current = false;
    
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
    
    monitoringIntervalRef.current = setInterval(() => {
      const random = Math.random();
      if (random < 0.1 && !isRegeneratingRef.current) {
        simulateRegeneration();
      }
    }, 3000);
  }, [simulateRegeneration]);

  const stopMonitoring = useCallback(() => {
    cleanupAll();
    setIsMonitoring(false);
    setIsConnected(false);
    setCurrentStatus("\u017D\u00C1DN\u00C1 DATA");
    
    if (Platform.OS !== "web") {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, [cleanupAll]);

  const testOverlay = useCallback(() => {
    setShowAlert(true);
    playDPFAlertSound();
    
    if (Platform.OS !== "web") {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
    
    setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  }, []);

  const testSound = useCallback(() => {
    playDPFAlertSound();
    
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.lg,
        },
      ]}
    >
      <DPFAlertOverlay 
        visible={showAlert} 
        onDismiss={() => setShowAlert(false)} 
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={appIcon} style={styles.appIcon} contentFit="contain" />
          <View style={styles.headerTextContainer}>
            <ThemedText type="h4" style={styles.appTitle}>
              Alarm DPF
            </ThemedText>
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? Colors.dark.success : Colors.dark.error },
                ]}
              />
              <ThemedText type="caption" color="secondary">
                {isConnected ? "P\u0158IPOJENO" : "ODPOJENO"}
              </ThemedText>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => navigation.navigate("SettingsTab")}
          style={styles.settingsButton}
        >
          <Feather name="settings" size={22} color={Colors.dark.secondaryText} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <ThemedText type="caption" color="secondary" style={styles.sectionLabel}>
          ZNA\u010CKA VOZIDLA
        </ThemedText>
        
        <View style={styles.brandsContainer}>
          <View style={styles.brandRow}>
            {BRANDS.slice(0, 3).map((brand) => (
              <BrandButton
                key={brand.id}
                name={brand.name}
                isSelected={selectedVehicle === brand.id}
                onPress={() => handleSelectVehicle(brand.id)}
              />
            ))}
          </View>
          <View style={styles.brandRowBottom}>
            {BRANDS.slice(3).map((brand) => (
              <BrandButton
                key={brand.id}
                name={brand.name}
                isSelected={selectedVehicle === brand.id}
                onPress={() => handleSelectVehicle(brand.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusIcon}>
            <Feather
              name={isRegenerating ? "zap" : "activity"}
              size={32}
              color={isRegenerating ? Colors.dark.alertRed : Colors.dark.secondaryText}
            />
          </View>
          <ThemedText type="caption" color="secondary" style={styles.statusLabel}>
            AKTU\u00C1LN\u00CD STAV
          </ThemedText>
          <ThemedText
            type="h2"
            style={[
              styles.statusValue,
              { color: isRegenerating ? Colors.dark.alertRed : Colors.dark.text },
            ]}
          >
            {currentStatus}
          </ThemedText>
        </View>

        <Button
          onPress={isMonitoring ? stopMonitoring : startMonitoring}
          disabled={!selectedVehicle}
          icon={isMonitoring ? "pause" : "power"}
          style={styles.mainButton}
        >
          {isMonitoring ? "ZASTAVIT MONITOROV\u00C1N\u00CD" : "SPUSTIT MONITOROV\u00C1N\u00CD"}
        </Button>

        <View style={styles.testButtonsRow}>
          <Pressable
            onPress={testOverlay}
            style={({ pressed }) => [
              styles.testButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="layers" size={18} color={Colors.dark.secondaryText} />
            <ThemedText type="small" color="secondary" style={styles.testButtonText}>
              Test p\u0159ekryvu
            </ThemedText>
          </Pressable>
          
          <Pressable
            onPress={testSound}
            style={({ pressed }) => [
              styles.testButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="volume-2" size={18} color={Colors.dark.secondaryText} />
            <ThemedText type="small" color="secondary" style={styles.testButtonText}>
              Testovac\u00ED zvuk
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing["2xl"],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
  },
  headerTextContainer: {
    marginLeft: Spacing.md,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  brandsContainer: {
    marginBottom: Spacing["3xl"],
  },
  brandRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  brandRowBottom: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingRight: "33%",
  },
  statusContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  statusLabel: {
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    textAlign: "center",
  },
  mainButton: {
    marginTop: Spacing.lg,
  },
  testButtonsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  testButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.cardBackground,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  testButtonText: {
    marginLeft: Spacing.sm,
  },
});
