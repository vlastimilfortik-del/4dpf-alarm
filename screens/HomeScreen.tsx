import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Platform } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { VehicleBrandCard } from "@/components/VehicleBrandCard";
import { StatusCard } from "@/components/StatusCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { Colors, Spacing } from "@/constants/theme";
import { VEHICLE_BRANDS } from "@/constants/vehicles";
import { storage, DPFHistoryEntry } from "@/utils/storage";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "Home">,
  BottomTabNavigationProp<MainTabParamList>
>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [lastRegeneration, setLastRegeneration] = useState<DPFHistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [vehicle, history] = await Promise.all([
        storage.getSelectedVehicle(),
        storage.getDPFHistory(),
      ]);
      setSelectedVehicle(vehicle);
      setLastRegeneration(history.length > 0 ? history[0] : null);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSelectVehicle = useCallback(async (brandId: string) => {
    setSelectedVehicle(brandId);
    
    try {
      await storage.setSelectedVehicle(brandId);
    } catch (error) {
      console.error("Failed to save vehicle:", error);
    }
    
    if (Platform.OS !== "web") {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, []);

  const handleStartRegeneration = useCallback(() => {
    if (selectedVehicle) {
      if (Platform.OS !== "web") {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
          console.log("Haptics not available");
        }
      }
      navigation.navigate("DiagnosticsTab");
    }
  }, [selectedVehicle, navigation]);

  const getDPFStatus = (): { value: string; status: "normal" | "warning" | "critical" | "success" } => {
    if (!lastRegeneration) {
      return { value: "No Data", status: "normal" };
    }
    if (lastRegeneration.completed) {
      return { value: "Clean", status: "success" };
    }
    if (lastRegeneration.progress < 50) {
      return { value: "High", status: "critical" };
    }
    return { value: "Medium", status: "warning" };
  };

  const getLastRegenTime = (): string => {
    if (!lastRegeneration) {
      return "Never";
    }
    const diff = Date.now() - lastRegeneration.endTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    return "Just now";
  };

  const dpfStatus = getDPFStatus();

  return (
    <View style={styles.container}>
      <ScreenScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.link}
          />
        }
      >
        <ThemedText type="h3" style={styles.sectionTitle}>
          Select Vehicle
        </ThemedText>
        <ThemedText type="small" color="secondary" style={styles.sectionSubtitle}>
          Choose your VAG group vehicle for diagnostics
        </ThemedText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.vehicleScroll}
          contentContainerStyle={styles.vehicleScrollContent}
        >
          {VEHICLE_BRANDS.map((brand) => (
            <VehicleBrandCard
              key={brand.id}
              brand={brand}
              isSelected={selectedVehicle === brand.id}
              onPress={() => handleSelectVehicle(brand.id)}
            />
          ))}
        </ScrollView>

        <ThemedText type="h3" style={styles.sectionTitle}>
          Status Overview
        </ThemedText>

        <View style={styles.statusGrid}>
          <StatusCard
            title="DPF Level"
            value={dpfStatus.value}
            icon="filter"
            status={dpfStatus.status}
          />
          <View style={styles.statusSpacer} />
          <StatusCard
            title="Last Regeneration"
            value={getLastRegenTime()}
            icon="clock"
            status="normal"
          />
          <View style={styles.statusSpacer} />
          <StatusCard
            title="Bluetooth"
            value="Not Connected"
            icon="bluetooth"
            iconColor={Colors.dark.neutral}
            onPress={() => navigation.navigate("SettingsTab")}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScreenScrollView>

      <FloatingActionButton
        icon="play"
        label="Start Regeneration"
        onPress={handleStartRegeneration}
        disabled={!selectedVehicle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.lg,
  },
  vehicleScroll: {
    marginHorizontal: -Spacing.xl,
    marginBottom: Spacing["2xl"],
  },
  vehicleScrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  statusGrid: {
    gap: Spacing.md,
  },
  statusSpacer: {
    height: 0,
  },
  bottomSpacer: {
    height: 80,
  },
});
