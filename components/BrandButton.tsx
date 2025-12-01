import React from "react";
import { StyleSheet, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type BrandButtonProps = {
  name: string;
  isSelected: boolean;
  onPress: () => void;
};

export function BrandButton({ name, isSelected, onPress }: BrandButtonProps) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        // Haptics not available
      }
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.button,
        isSelected ? styles.buttonSelected : styles.buttonDefault,
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          isSelected ? styles.textSelected : styles.textDefault,
        ]}
      >
        {name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 100,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  buttonDefault: {
    backgroundColor: Colors.dark.cardBackground,
    borderColor: Colors.dark.cardBorder,
  },
  buttonSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
  textDefault: {
    color: Colors.dark.secondaryText,
  },
  textSelected: {
    color: Colors.dark.buttonText,
  },
});
