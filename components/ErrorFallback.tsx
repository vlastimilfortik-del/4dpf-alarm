import React, { useState } from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Text,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Fonts, Colors } from "@/constants/theme";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  return (
    <ThemedView style={styles.container}>
      {__DEV__ ? (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          style={({ pressed }) => [
            styles.topButton,
            {
              backgroundColor: Colors.dark.backgroundDefault,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="alert-circle" size={20} color={Colors.dark.text} />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="alert-triangle" size={48} color={Colors.dark.warning} />
        </View>
        <ThemedText type="h2" style={styles.title}>
          VAG Diagnostics Encountered an Issue
        </ThemedText>

        <ThemedText type="body" color="secondary" style={styles.message}>
          Something unexpected happened. Please restart the app to continue your diagnostics session.
        </ThemedText>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: Colors.dark.link,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Feather name="refresh-cw" size={20} color={Colors.dark.buttonText} style={styles.buttonIcon} />
          <ThemedText
            type="body"
            style={[styles.buttonText, { color: Colors.dark.buttonText }]}
          >
            Restart Diagnostics
          </ThemedText>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ThemedText type="h3" style={styles.modalTitle}>
                  Error Details
                </ThemedText>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Feather name="x" size={24} color={Colors.dark.text} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
              >
                <View
                  style={[
                    styles.errorContainer,
                    { backgroundColor: Colors.dark.backgroundDefault },
                  ]}
                >
                  <Text
                    style={[
                      styles.errorText,
                      {
                        color: Colors.dark.text,
                        fontFamily: Fonts?.mono || "monospace",
                      },
                    ]}
                    selectable
                  >
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </ThemedView>
          </View>
        </Modal>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    width: "100%",
    maxWidth: 600,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  topButton: {
    position: "absolute",
    top: Spacing["2xl"] + Spacing.lg,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing["2xl"],
    minWidth: 200,
    marginTop: Spacing.lg,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "90%",
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    fontWeight: "600",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  errorContainer: {
    width: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: 12,
    width: "100%",
  },
});
