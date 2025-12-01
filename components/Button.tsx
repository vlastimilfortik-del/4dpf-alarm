import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "destructive";
  icon?: keyof typeof Feather.glyphMap;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  icon,
}: ButtonProps) {
  const scale = useSharedValue(1);

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

  const getBackgroundColor = () => {
    if (disabled) return Colors.dark.neutral;
    switch (variant) {
      case "secondary":
        return "transparent";
      case "destructive":
        return Colors.dark.error;
      default:
        return Colors.dark.link;
    }
  };

  const getBorderStyle = () => {
    if (variant === "secondary") {
      return {
        borderWidth: 1,
        borderColor: Colors.dark.link,
      };
    }
    return {};
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          opacity: disabled ? 0.5 : 1,
        },
        getBorderStyle(),
        style,
        animatedStyle,
      ]}
    >
      {icon ? (
        <Feather
          name={icon}
          size={20}
          color={variant === "secondary" ? Colors.dark.link : Colors.dark.buttonText}
          style={styles.icon}
        />
      ) : null}
      <ThemedText
        type="body"
        style={[
          styles.buttonText,
          {
            color: variant === "secondary" ? Colors.dark.link : Colors.dark.buttonText,
          },
        ]}
      >
        {children}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: Spacing["2xl"],
  },
  buttonText: {
    fontWeight: "600",
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
