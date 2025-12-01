import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { StatusCard } from "@/components/StatusCard";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getVehicleBrand } from "@/constants/vehicles";
import { storage, DPFHistoryEntry } from "@/utils/storage";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type VehicleDetailScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, "VehicleDetail">;
  route: RouteProp<HomeStackParamList, "VehicleDetail">;
};

export default function VehicleDetailScreen({ navigation, route }: VehicleDetailScreenProps) {
  const { brand: brandId } = route.params;
  const [history, setHistory] = useState<DPFHistoryEntry[]>([]);

  const loadHistory = useCallback(async () => {
    const allHistory = await storage.getDPFHistory();
    const brandHistory = allHistory.filter((entry) => entry.brand === brandId);
    setHistory(brandHistory);
  }, [brandId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const brand = getVehicleBrand(brandId);

  if (!brand) {
    return (
      <ScreenScrollView>
        <ThemedText type="body">Vehicle not found</ThemedText>
      </ScreenScrollView>
    );
  }

  const completedCount = history.filter((h) => h.completed).length;
  const totalCount = history.length;
  const successRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (start: number, end: number): string => {
    const seconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <ScreenScrollView>
      <View style={[styles.header, { backgroundColor: brand.color + "20" }]}>
        <View style={[styles.iconContainer, { backgroundColor: brand.color }]}>
          <Feather name="truck" size={32} color="#FFFFFF" />
        </View>
        <ThemedText type="h2" style={styles.brandName}>
          {brand.name}
        </ThemedText>
        <ThemedText type="small" color="secondary">
          VAG Group Vehicle
        </ThemedText>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText type="h2" style={{ color: Colors.dark.link }}>
            {totalCount}
          </ThemedText>
          <ThemedText type="small" color="secondary">
            Total Regens
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h2" style={{ color: Colors.dark.success }}>
            {completedCount}
          </ThemedText>
          <ThemedText type="small" color="secondary">
            Completed
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h2" style={{ color: Colors.dark.warning }}>
            {successRate}%
          </ThemedText>
          <ThemedText type="small" color="secondary">
            Success Rate
          </ThemedText>
        </View>
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Regeneration History
      </ThemedText>

      {history.length > 0 ? (
        history.map((entry, index) => (
          <Card key={entry.id} elevation={1} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: entry.completed
                      ? Colors.dark.success + "20"
                      : Colors.dark.error + "20",
                  },
                ]}
              >
                <Feather
                  name={entry.completed ? "check-circle" : "x-circle"}
                  size={14}
                  color={entry.completed ? Colors.dark.success : Colors.dark.error}
                />
                <ThemedText
                  type="caption"
                  style={{
                    color: entry.completed ? Colors.dark.success : Colors.dark.error,
                    marginLeft: Spacing.xs,
                  }}
                >
                  {entry.completed ? "Completed" : "Stopped"}
                </ThemedText>
              </View>
              <ThemedText type="caption" color="secondary">
                {formatDate(entry.endTime)}
              </ThemedText>
            </View>
            <View style={styles.historyDetails}>
              <View style={styles.historyDetail}>
                <Feather name="percent" size={14} color={Colors.dark.secondaryText} />
                <ThemedText type="small" color="secondary" style={styles.historyDetailText}>
                  {Math.round(entry.progress)}% progress
                </ThemedText>
              </View>
              <View style={styles.historyDetail}>
                <Feather name="clock" size={14} color={Colors.dark.secondaryText} />
                <ThemedText type="small" color="secondary" style={styles.historyDetailText}>
                  {formatDuration(entry.startTime, entry.endTime)}
                </ThemedText>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Card elevation={1} style={styles.emptyCard}>
          <Feather name="inbox" size={32} color={Colors.dark.secondaryText} />
          <ThemedText type="body" color="secondary" style={styles.emptyText}>
            No regeneration history
          </ThemedText>
          <ThemedText type="small" color="secondary" style={styles.emptySubtext}>
            Start a DPF regeneration to see history here
          </ThemedText>
        </Card>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  brandName: {
    marginBottom: Spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xl,
    marginBottom: Spacing["2xl"],
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  historyCard: {
    marginBottom: Spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  historyDetails: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  historyDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyDetailText: {
    marginLeft: Spacing.xs,
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
});
