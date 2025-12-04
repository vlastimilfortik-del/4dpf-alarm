import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "./ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type DPFAlertOverlayProps = {
  visible: boolean;
  onDismiss?: () => void;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function DPFAlertOverlay({ visible, onDismiss }: DPFAlertOverlayProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.alertBox, animatedStyle]}>
        <View style={styles.iconContainer}>
          <Feather name="alert-triangle" size={64} color={Colors.dark.text} />
        </View>
        <ThemedText type="h2" style={styles.title}>
          AKTIVNÍ REGENERACE DPF
        </ThemedText>
        <View style={styles.divider} />
        <ThemedText type="h4" style={styles.subtitle}>
          NEVYPÍNEJTE MOTOR
        </ThemedText>
        <ThemedText type="body" style={styles.description}>
          Probíhá čištění filtru pevných částic
        </ThemedText>
      </Animated.View>
      {onDismiss ? (
        <Pressable 
          onPress={onDismiss} 
          style={[styles.closeButton, { top: insets.top + Spacing.md }]}
        >
          <Feather name="x" size={28} color={Colors.dark.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    backgroundColor: Colors.dark.alertRed,
    borderRadius: BorderRadius.xl,
    padding: Spacing["3xl"],
    marginHorizontal: Spacing.xl,
    alignItems: "center",
    width: SCREEN_WIDTH - Spacing.xl * 2,
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.dark.text,
    textAlign: "center",
    fontWeight: "800",
    letterSpacing: 1,
  },
  divider: {
    width: 80,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginVertical: Spacing.lg,
    borderRadius: 2,
  },
  subtitle: {
    color: Colors.dark.text,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  description: {
    color: "#FFCDD2",
    textAlign: "center",
    fontSize: 14,
  },
  closeButton: {
    position: "absolute",
    right: Spacing.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
