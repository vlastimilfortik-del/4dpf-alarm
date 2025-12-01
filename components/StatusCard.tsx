import React from "react";
import { StyleSheet, View, Pressable, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface StatusCardProps {
  title: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  status?: "normal" | "warning" | "critical" | "success";
  onPress?: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StatusCard({
  title,
  value,
  icon,
  iconColor,
  status = "normal",
  onPress,
}: StatusCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.96, springConfig);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== "web") {
        try {
          Haptics.selectionAsync();
        } catch (error) {
          console.log("Haptics not available");
        }
      }
      onPress();
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return Colors.dark.success;
      case "warning":
        return Colors.dark.warning;
      case "critical":
        return Colors.dark.error;
      default:
        return Colors.dark.link;
    }
  };

  const statusColor = iconColor || getStatusColor();

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: Colors.dark.backgroundDefault,
          borderColor: Colors.dark.border,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: statusColor + "20" }]}>
        <Feather name={icon} size={20} color={statusColor} />
      </View>
      <View style={styles.content}>
        <ThemedText type="small" color="secondary">
          {title}
        </ThemedText>
        <ThemedText type="h4" style={{ color: statusColor }}>
          {value}
        </ThemedText>
      </View>
      {onPress ? (
        <Feather name="chevron-right" size={20} color={Colors.dark.secondaryText} />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
});
