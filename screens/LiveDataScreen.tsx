import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { obd2Simulator, OBD2Data, OBD2Status } from "@/utils/obd2Simulator";
import { storage } from "@/utils/storage";

interface DataGaugeProps {
  label: string;
  value: number | string;
  unit: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  min?: number;
  max?: number;
  warning?: number;
  critical?: number;
}

function DataGauge({
  label,
  value,
  unit,
  icon,
  color = Colors.dark.link,
  min = 0,
  max = 100,
  warning,
  critical,
}: DataGaugeProps) {
  const numValue = typeof value === "number" ? value : 0;
  const percentage = Math.min(100, Math.max(0, ((numValue - min) / (max - min)) * 100));
  
  let barColor = color;
  if (critical !== undefined && numValue >= critical) {
    barColor = Colors.dark.error;
  } else if (warning !== undefined && numValue >= warning) {
    barColor = Colors.dark.warning;
  }

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeHeader}>
        <View style={[styles.gaugeIcon, { backgroundColor: barColor + "20" }]}>
          <Feather name={icon} size={14} color={barColor} />
        </View>
        <ThemedText type="small" color="secondary">
          {label}
        </ThemedText>
      </View>
      <View style={styles.gaugeValue}>
        <ThemedText type="h3" style={{ color: barColor }}>
          {typeof value === "number" ? value.toFixed(value < 10 ? 1 : 0) : value}
        </ThemedText>
        <ThemedText type="caption" color="secondary" style={styles.gaugeUnit}>
          {unit}
        </ThemedText>
      </View>
      <View style={styles.gaugeBar}>
        <View
          style={[
            styles.gaugeBarFill,
            { width: `${percentage}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

export default function LiveDataScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [data, setData] = useState<OBD2Data | null>(null);
  const [status, setStatus] = useState<OBD2Status | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [errorCodes, setErrorCodes] = useState<string[]>([]);
  const [isReadingCodes, setIsReadingCodes] = useState(false);

  useEffect(() => {
    storage.getSelectedVehicle().then(setSelectedVehicle);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = obd2Simulator.subscribe((newData) => {
      setData(newData);
      setStatus(obd2Simulator.getStatus());
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  const handleConnect = useCallback(async () => {
    if (!selectedVehicle) return;

    setIsConnecting(true);
    
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log("Haptics not available");
      }
    }

    const success = await obd2Simulator.connect(selectedVehicle);
    
    if (success) {
      setIsConnected(true);
      setData(obd2Simulator.getData());
      setStatus(obd2Simulator.getStatus());
      
      if (Platform.OS !== "web") {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.log("Haptics not available");
        }
      }
    }
    
    setIsConnecting(false);
  }, [selectedVehicle]);

  const handleDisconnect = useCallback(() => {
    obd2Simulator.disconnect();
    setIsConnected(false);
    setData(null);
    setStatus(null);
    setErrorCodes([]);
    
    if (Platform.OS !== "web") {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, []);

  const handleReadCodes = useCallback(async () => {
    setIsReadingCodes(true);
    
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
    
    const codes = await obd2Simulator.readErrorCodes();
    setErrorCodes(codes);
    setIsReadingCodes(false);
  }, []);

  const handleClearCodes = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
    
    await obd2Simulator.clearErrorCodes();
    setErrorCodes([]);
    
    if (Platform.OS !== "web") {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, []);

  if (!isConnected) {
    return (
      <ScreenScrollView>
        <View style={styles.connectContainer}>
          <View style={styles.iconCircle}>
            <Feather name="activity" size={48} color={Colors.dark.link} />
          </View>
          <ThemedText type="h3" style={styles.connectTitle}>
            Live Data Monitor
          </ThemedText>
          <ThemedText type="body" color="secondary" style={styles.connectSubtitle}>
            Connect to your vehicle's OBD-II system to view real-time sensor data
          </ThemedText>
          
          {!selectedVehicle ? (
            <View style={styles.warningBox}>
              <Feather name="alert-circle" size={20} color={Colors.dark.warning} />
              <ThemedText type="small" color="secondary" style={styles.warningText}>
                Select a vehicle from the Home screen first
              </ThemedText>
            </View>
          ) : null}
          
          <Button
            onPress={handleConnect}
            disabled={!selectedVehicle || isConnecting}
            icon={isConnecting ? undefined : "wifi"}
          >
            {isConnecting ? "Connecting..." : "Connect to Vehicle"}
          </Button>
          
          <ThemedText type="caption" color="secondary" style={styles.disclaimer}>
            This is a simulation mode. Real OBD-II connection requires a physical adapter.
          </ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <Card elevation={1} style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <ThemedText type="small" color="success">
              Connected
            </ThemedText>
          </View>
          <Button
            onPress={handleDisconnect}
            variant="secondary"
            size="small"
            icon="wifi-off"
          >
            Disconnect
          </Button>
        </View>
        {status?.vehicleVIN ? (
          <ThemedText type="caption" color="secondary">
            VIN: {status.vehicleVIN}
          </ThemedText>
        ) : null}
        {status?.protocol ? (
          <ThemedText type="caption" color="secondary">
            Protocol: {status.protocol}
          </ThemedText>
        ) : null}
      </Card>

      <ThemedText type="h4" style={styles.sectionTitle}>
        DPF System
      </ThemedText>
      <View style={styles.gaugeGrid}>
        <DataGauge
          label="DPF Temperature"
          value={data?.dpfTemperature || 0}
          unit="C"
          icon="thermometer"
          color={Colors.dark.warning}
          min={100}
          max={700}
          warning={550}
          critical={620}
        />
        <DataGauge
          label="DPF Pressure"
          value={data?.dpfPressure || 0}
          unit="kPa"
          icon="arrow-down"
          color={Colors.dark.link}
          min={0}
          max={100}
          warning={60}
          critical={80}
        />
        <DataGauge
          label="Soot Level"
          value={data?.dpfSootLevel || 0}
          unit="%"
          icon="cloud"
          color={Colors.dark.neutral}
          min={0}
          max={100}
          warning={60}
          critical={80}
        />
        <DataGauge
          label="Exhaust Temp"
          value={data?.exhaustTemperature || 0}
          unit="C"
          icon="wind"
          color={Colors.dark.accent}
          min={100}
          max={500}
          warning={400}
          critical={450}
        />
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Engine Data
      </ThemedText>
      <View style={styles.gaugeGrid}>
        <DataGauge
          label="Engine RPM"
          value={data?.engineRPM || 0}
          unit="rpm"
          icon="disc"
          color={Colors.dark.link}
          min={0}
          max={6000}
          warning={5000}
          critical={5500}
        />
        <DataGauge
          label="Engine Load"
          value={data?.engineLoad || 0}
          unit="%"
          icon="cpu"
          color={Colors.dark.accent}
          min={0}
          max={100}
          warning={80}
          critical={90}
        />
        <DataGauge
          label="Coolant Temp"
          value={data?.coolantTemperature || 0}
          unit="C"
          icon="droplet"
          color={Colors.dark.link}
          min={0}
          max={120}
          warning={100}
          critical={110}
        />
        <DataGauge
          label="Oil Temp"
          value={data?.oilTemperature || 0}
          unit="C"
          icon="droplet"
          color={Colors.dark.warning}
          min={0}
          max={150}
          warning={110}
          critical={130}
        />
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Additional Sensors
      </ThemedText>
      <View style={styles.gaugeGrid}>
        <DataGauge
          label="Battery"
          value={data?.batteryVoltage || 0}
          unit="V"
          icon="battery"
          color={Colors.dark.success}
          min={10}
          max={15}
          warning={12}
          critical={11}
        />
        <DataGauge
          label="Fuel Level"
          value={data?.fuelLevel || 0}
          unit="%"
          icon="box"
          color={Colors.dark.warning}
          min={0}
          max={100}
          warning={15}
          critical={10}
        />
        <DataGauge
          label="Turbo Boost"
          value={data?.turboBoostPressure || 0}
          unit="bar"
          icon="zap"
          color={Colors.dark.accent}
          min={0}
          max={2.5}
          warning={2.0}
          critical={2.3}
        />
        <DataGauge
          label="MAF"
          value={data?.massAirFlow || 0}
          unit="g/s"
          icon="wind"
          color={Colors.dark.link}
          min={0}
          max={50}
        />
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Diagnostic Codes
      </ThemedText>
      <Card elevation={1}>
        <View style={styles.codesHeader}>
          <Button
            onPress={handleReadCodes}
            variant="secondary"
            size="small"
            icon="search"
            disabled={isReadingCodes}
          >
            {isReadingCodes ? "Reading..." : "Read Codes"}
          </Button>
          {errorCodes.length > 0 ? (
            <Button
              onPress={handleClearCodes}
              variant="destructive"
              size="small"
              icon="trash-2"
            >
              Clear
            </Button>
          ) : null}
        </View>
        
        {errorCodes.length === 0 ? (
          <View style={styles.noCodesContainer}>
            <Feather name="check-circle" size={24} color={Colors.dark.success} />
            <ThemedText type="small" color="success" style={styles.noCodesText}>
              No error codes found
            </ThemedText>
          </View>
        ) : (
          <View style={styles.codesList}>
            {errorCodes.map((code) => (
              <View key={code} style={styles.codeItem}>
                <View style={styles.codeBadge}>
                  <ThemedText type="small" style={styles.codeText}>
                    {code}
                  </ThemedText>
                </View>
                <ThemedText type="caption" color="secondary" style={styles.codeDescription}>
                  {obd2Simulator.getErrorCodeDescription(code)}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  connectContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing["3xl"],
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.link + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  connectTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  connectSubtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.warning + "20",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  warningText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  disclaimer: {
    textAlign: "center",
    marginTop: Spacing.xl,
    fontStyle: "italic",
  },
  statusCard: {
    marginBottom: Spacing.xl,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.success,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  gaugeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  gaugeContainer: {
    width: "48%",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  gaugeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  gaugeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  gaugeValue: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.sm,
  },
  gaugeUnit: {
    marginLeft: Spacing.xs,
  },
  gaugeBar: {
    height: 4,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 2,
    overflow: "hidden",
  },
  gaugeBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  codesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  noCodesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  noCodesText: {
    marginLeft: Spacing.sm,
  },
  codesList: {
    gap: Spacing.md,
  },
  codeItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeBadge: {
    backgroundColor: Colors.dark.error + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.md,
  },
  codeText: {
    color: Colors.dark.error,
    fontFamily: "monospace",
  },
  codeDescription: {
    flex: 1,
  },
});
