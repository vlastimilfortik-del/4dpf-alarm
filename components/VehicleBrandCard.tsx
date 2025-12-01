import React from "react";
import { StyleSheet, Pressable, View, Platform } from "react-native";
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
import { VehicleBrand } from "@/constants/vehicles";

interface VehicleBrandCardProps {
  brand: VehicleBrand;
  isSelected: boolean;
  onPress: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VehicleBrandCard({ brand, isSelected, onPress }: VehicleBrandCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: Colors.dark.backgroundDefault,
          borderColor: isSelected ? brand.color : Colors.dark.border,
          borderWidth: isSelected ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: brand.color }]}>
        <Feather name="truck" size={24} color="#FFFFFF" />
      </View>
      <ThemedText type="small" style={styles.brandName}>
        {brand.name}
      </ThemedText>
      {isSelected ? (
        <View style={[styles.checkmark, { backgroundColor: brand.color }]}>
          <Feather name="check" size={12} color="#FFFFFF" />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    padding: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  brandName: {
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
