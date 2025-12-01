import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface CardProps {
  children: ReactNode;
  elevation?: 1 | 2 | 3;
  onPress?: () => void;
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

const getBackgroundColorForElevation = (elevation: number): string => {
  switch (elevation) {
    case 1:
      return Colors.dark.backgroundDefault;
    case 2:
      return Colors.dark.backgroundSecondary;
    case 3:
      return Colors.dark.backgroundTertiary;
    default:
      return Colors.dark.backgroundDefault;
  }
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  children,
  elevation = 1,
  onPress,
  style,
  disabled = false,
}: CardProps) {
  const scale = useSharedValue(1);

  const cardBackgroundColor = getBackgroundColorForElevation(elevation);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.96, springConfig);
    }
  };

  const handlePressOut = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      style={[
        styles.card,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: Colors.dark.border,
        },
        style,
        animatedStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
