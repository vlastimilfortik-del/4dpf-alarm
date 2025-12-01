import React from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface FloatingActionButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingActionButton({
  icon,
  label,
  onPress,
  style,
  disabled = false,
}: FloatingActionButtonProps) {
  const scale = useSharedValue(1);
  const tabBarHeight = useBottomTabBarHeight();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.96, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.fab,
        {
          backgroundColor: disabled ? Colors.dark.neutral : Colors.dark.link,
          bottom: tabBarHeight + Spacing.lg,
          opacity: disabled ? 0.5 : 1,
        },
        style,
        animatedStyle,
      ]}
    >
      <Feather name={icon} size={24} color={Colors.dark.buttonText} />
      {label ? (
        <ThemedText type="body" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    elevation: 4,
  },
  label: {
    color: Colors.dark.buttonText,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
});
