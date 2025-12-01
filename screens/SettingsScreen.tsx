import React, { useState, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable, Platform } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { VEHICLE_BRANDS, getVehicleBrand } from "@/constants/vehicles";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "Settings">;
};

const AVATAR_ICONS: (keyof typeof Feather.glyphMap)[] = ["tool", "truck", "cpu"];

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [displayName, setDisplayName] = useState("Mechanic");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [defaultVehicle, setDefaultVehicle] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const [name, avatar, sound, vehicle] = await Promise.all([
        storage.getDisplayName(),
        storage.getAvatarIndex(),
        storage.getSoundEnabled(),
        storage.getSelectedVehicle(),
      ]);
      setDisplayName(name);
      setAvatarIndex(avatar);
      setSoundEnabled(sound);
      setDefaultVehicle(vehicle);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, []);

  const handleNameChange = useCallback(async (name: string) => {
    setDisplayName(name);
    try {
      await storage.setDisplayName(name);
    } catch (error) {
      console.error("Failed to save name:", error);
    }
  }, []);

  const handleAvatarChange = useCallback(async (index: number) => {
    setAvatarIndex(index);
    triggerHaptic();
    try {
      await storage.setAvatarIndex(index);
    } catch (error) {
      console.error("Failed to save avatar:", error);
    }
  }, [triggerHaptic]);

  const handleSoundToggle = useCallback(async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    triggerHaptic();
    try {
      await storage.setSoundEnabled(newValue);
    } catch (error) {
      console.error("Failed to save sound setting:", error);
    }
  }, [soundEnabled, triggerHaptic]);

  const handleVehicleSelect = useCallback(async (vehicleId: string) => {
    setDefaultVehicle(vehicleId);
    triggerHaptic();
    try {
      await storage.setSelectedVehicle(vehicleId);
    } catch (error) {
      console.error("Failed to save vehicle:", error);
    }
  }, [triggerHaptic]);

  const handleBluetoothPress = useCallback(() => {
    triggerHaptic();
    navigation.navigate("BluetoothPairing");
  }, [navigation, triggerHaptic]);

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Profile
        </ThemedText>
        <Card elevation={1} style={styles.profileCard}>
          <View style={styles.avatarRow}>
            {AVATAR_ICONS.map((icon, index) => (
              <Pressable
                key={icon}
                onPress={() => handleAvatarChange(index)}
                style={({ pressed }) => [
                  styles.avatarButton,
                  {
                    backgroundColor:
                      avatarIndex === index
                        ? Colors.dark.link
                        : Colors.dark.backgroundSecondary,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <Feather
                  name={icon}
                  size={24}
                  color={
                    avatarIndex === index
                      ? Colors.dark.buttonText
                      : Colors.dark.secondaryText
                  }
                />
              </Pressable>
            ))}
          </View>
          <View style={styles.inputContainer}>
            <ThemedText type="small" color="secondary" style={styles.inputLabel}>
              Display Name
            </ThemedText>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={handleNameChange}
              placeholder="Enter your name"
              placeholderTextColor={Colors.dark.disabledText}
              autoCapitalize="words"
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Bluetooth
        </ThemedText>
        <Card elevation={1} onPress={handleBluetoothPress}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Feather name="bluetooth" size={20} color={Colors.dark.link} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="body">OBD-II Adapter</ThemedText>
              <ThemedText type="small" color="secondary">
                Not connected
              </ThemedText>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={Colors.dark.secondaryText}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Preferences
        </ThemedText>
        <Card elevation={1}>
          <Pressable
            onPress={handleSoundToggle}
            style={({ pressed }) => [
              styles.settingRow,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={styles.settingIcon}>
              <Feather
                name={soundEnabled ? "volume-2" : "volume-x"}
                size={20}
                color={soundEnabled ? Colors.dark.success : Colors.dark.neutral}
              />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="body">Sound Notifications</ThemedText>
              <ThemedText type="small" color="secondary">
                {soundEnabled ? "Enabled" : "Disabled"}
              </ThemedText>
            </View>
            <View
              style={[
                styles.toggle,
                {
                  backgroundColor: soundEnabled
                    ? Colors.dark.success
                    : Colors.dark.neutral,
                },
              ]}
            >
              <View
                style={[
                  styles.toggleKnob,
                  { transform: [{ translateX: soundEnabled ? 20 : 0 }] },
                ]}
              />
            </View>
          </Pressable>
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Default Vehicle
        </ThemedText>
        <Card elevation={1}>
          {VEHICLE_BRANDS.map((brand, index) => (
            <Pressable
              key={brand.id}
              onPress={() => handleVehicleSelect(brand.id)}
              style={({ pressed }) => [
                styles.vehicleRow,
                index < VEHICLE_BRANDS.length - 1 && styles.vehicleBorder,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View
                style={[styles.vehicleIcon, { backgroundColor: brand.color + "20" }]}
              >
                <Feather name="truck" size={16} color={brand.color} />
              </View>
              <ThemedText type="body" style={styles.vehicleName}>
                {brand.name}
              </ThemedText>
              {defaultVehicle === brand.id ? (
                <Feather name="check" size={20} color={Colors.dark.success} />
              ) : null}
            </Pressable>
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          About
        </ThemedText>
        <Card elevation={1}>
          <View style={styles.aboutRow}>
            <ThemedText type="body">VAG Diagnostics</ThemedText>
            <ThemedText type="small" color="secondary">
              Version 1.0.0
            </ThemedText>
          </View>
        </Card>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  profileCard: {
    padding: Spacing.xl,
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatarButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    width: "100%",
  },
  inputLabel: {
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    color: Colors.dark.text,
    fontSize: Typography.body.fontSize,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.dark.buttonText,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  vehicleBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  vehicleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  vehicleName: {
    flex: 1,
  },
  aboutRow: {
    paddingVertical: Spacing.sm,
  },
});
