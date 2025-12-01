import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Platform, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { storage, DPFHistoryEntry } from "@/utils/storage";
import { getVehicleBrand } from "@/constants/vehicles";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { exportReport } from "@/utils/reportExport";

function formatDuration(startTime: number, endTime: number): string {
  const diff = Math.floor((endTime - startTime) / 1000);
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  return `${minutes}m ${seconds}s`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }
}

interface HistoryItemProps {
  item: DPFHistoryEntry;
  onPress: () => void;
}

function HistoryItem({ item, onPress }: HistoryItemProps) {
  const brand = getVehicleBrand(item.brand);
  const brandColor = brand?.color || Colors.dark.link;
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
    >
      <Card elevation={1} style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={[styles.brandBadge, { backgroundColor: brandColor + "20" }]}>
            <Feather name="truck" size={14} color={brandColor} />
            <ThemedText type="small" style={{ color: brandColor, marginLeft: Spacing.xs }}>
              {brand?.name || "Unknown"}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.completed
                  ? Colors.dark.success + "20"
                  : Colors.dark.warning + "20",
              },
            ]}
          >
            <Feather
              name={item.completed ? "check-circle" : "alert-circle"}
              size={12}
              color={item.completed ? Colors.dark.success : Colors.dark.warning}
            />
            <ThemedText
              type="caption"
              style={{
                color: item.completed ? Colors.dark.success : Colors.dark.warning,
                marginLeft: 4,
              }}
            >
              {item.completed ? "Complete" : "Stopped"}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.historyStats}>
          <View style={styles.statItem}>
            <Feather name="calendar" size={14} color={Colors.dark.secondaryText} />
            <ThemedText type="small" color="secondary" style={styles.statText}>
              {formatDate(item.startTime)}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="clock" size={14} color={Colors.dark.secondaryText} />
            <ThemedText type="small" color="secondary" style={styles.statText}>
              {formatDuration(item.startTime, item.endTime)}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="percent" size={14} color={Colors.dark.secondaryText} />
            <ThemedText type="small" color="secondary" style={styles.statText}>
              {Math.round(item.progress)}%
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.progress}%`,
                backgroundColor: item.completed ? Colors.dark.success : Colors.dark.warning,
              },
            ]}
          />
        </View>
      </Card>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const insets = useScreenInsets();
  const [history, setHistory] = useState<DPFHistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const data = await storage.getDPFHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const handleItemPress = useCallback((item: DPFHistoryEntry) => {
    if (Platform.OS !== "web") {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, []);

  const clearHistory = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
    
    try {
      await storage.clearDPFHistory();
      setHistory([]);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  }, []);

  const handleExport = useCallback(async (format: "txt" | "csv" | "json") => {
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
    
    const success = await exportReport(format, null);
    
    if (success) {
      if (Platform.OS !== "web") {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.log("Haptics not available");
        }
      }
    } else {
      Alert.alert(
        "Export Failed",
        "Unable to export the report. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, []);

  const showExportOptions = useCallback(() => {
    if (Platform.OS === "web") {
      handleExport("txt");
      return;
    }
    
    Alert.alert(
      "Export Report",
      "Choose export format",
      [
        { text: "Text (.txt)", onPress: () => handleExport("txt") },
        { text: "CSV (.csv)", onPress: () => handleExport("csv") },
        { text: "JSON (.json)", onPress: () => handleExport("json") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }, [handleExport]);

  const completedCount = history.filter((h) => h.completed).length;
  const stoppedCount = history.filter((h) => !h.completed).length;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={48} color={Colors.dark.secondaryText} />
      <ThemedText type="body" color="secondary" style={styles.emptyTitle}>
        No History Yet
      </ThemedText>
      <ThemedText type="small" color="secondary" style={styles.emptySubtitle}>
        Start a DPF regeneration to see your history here
      </ThemedText>
    </View>
  );

  const renderStatsHeader = () => (
    history.length > 0 ? (
      <View style={styles.statsRow}>
        <View style={styles.statsCard}>
          <ThemedText type="h2" style={{ color: Colors.dark.success }}>
            {completedCount}
          </ThemedText>
          <ThemedText type="caption" color="secondary">
            Completed
          </ThemedText>
        </View>
        <View style={styles.statsCard}>
          <ThemedText type="h2" style={{ color: Colors.dark.warning }}>
            {stoppedCount}
          </ThemedText>
          <ThemedText type="caption" color="secondary">
            Stopped
          </ThemedText>
        </View>
        <View style={styles.statsCard}>
          <ThemedText type="h2" style={{ color: Colors.dark.link }}>
            {history.length}
          </ThemedText>
          <ThemedText type="caption" color="secondary">
            Total
          </ThemedText>
        </View>
      </View>
    ) : null
  );

  const renderFooter = () => (
    history.length > 0 ? (
      <View style={styles.actionRow}>
        <Pressable
          onPress={showExportOptions}
          style={({ pressed }) => [
            styles.exportButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="download" size={16} color={Colors.dark.link} />
          <ThemedText type="small" style={{ color: Colors.dark.link, marginLeft: Spacing.sm }}>
            Export
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={clearHistory}
          style={({ pressed }) => [
            styles.clearButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="trash-2" size={16} color={Colors.dark.error} />
          <ThemedText type="small" style={{ color: Colors.dark.error, marginLeft: Spacing.sm }}>
            Clear
          </ThemedText>
        </Pressable>
      </View>
    ) : null
  );

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HistoryItem item={item} onPress={() => handleItemPress(item)} />
      )}
      style={styles.container}
      contentContainerStyle={[
        styles.listContent,
        { paddingTop: insets.paddingTop, paddingBottom: insets.paddingBottom + 80 },
        history.length === 0 && styles.emptyListContent,
      ]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderStatsHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.dark.link}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
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
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  historyStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: Spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyTitle: {
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  exportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dark.link + "10",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.link + "30",
  },
  clearButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dark.error + "10",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.error + "30",
  },
});
