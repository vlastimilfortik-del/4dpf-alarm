import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { Image } from "expo-image";

import { ThemedText } from "./ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type DPFAlertOverlayProps = {
  visible: boolean;
  onDismiss?: () => void;
};

const dpfIcon = require("@/assets/images/icon.png");

export function DPFAlertOverlay({ visible, onDismiss }: DPFAlertOverlayProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(opacity);
      opacity.value = 1;
    }
  }, [visible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.alertBox, animatedStyle]}>
        <View style={styles.iconContainer}>
          <Image source={dpfIcon} style={styles.dpfIcon} contentFit="contain" />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="h4" style={styles.title}>
            AKTIVNÍ REGENERACE DPF
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            NEVYPÍNEJTE MOTOR
          </ThemedText>
        </View>
        {onDismiss ? (
          <Pressable onPress={onDismiss} style={styles.closeButton}>
            <Feather name="x" size={24} color={Colors.dark.text} />
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 100,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1000,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.alertRed,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.dark.backgroundRoot,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  dpfIcon: {
    width: 28,
    height: 28,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    color: "#FFCDD2",
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
});
