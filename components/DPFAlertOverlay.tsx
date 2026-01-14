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
import { useTranslation } from "@/i18n";

type DPFAlertOverlayProps = {
  visible: boolean;
  onDismiss?: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function DPFAlertOverlay({ visible, onDismiss }: DPFAlertOverlayProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(1);
  const { t } = useTranslation();

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
        <View style={styles.contentRow}>
          <View style={styles.iconContainer}>
            <Feather name="alert-triangle" size={28} color={Colors.dark.text} />
          </View>
          <View style={styles.textContainer}>
            <ThemedText type="body" style={styles.title}>
              {t('activeRegeneration')}
            </ThemedText>
            <ThemedText type="caption" style={styles.subtitle}>
              {t('doNotTurnOffEngine')}
            </ThemedText>
          </View>
          {onDismiss ? (
            <Pressable onPress={onDismiss} style={styles.closeButton}>
              <Feather name="x" size={22} color={Colors.dark.text} />
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  alertBox: {
    backgroundColor: Colors.dark.alertRed,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.dark.text,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
});
