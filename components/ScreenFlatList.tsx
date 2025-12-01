import React from "react";
import { FlatList, FlatListProps, StyleSheet } from "react-native";

import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, Colors } from "@/constants/theme";

export function ScreenFlatList<T>({
  contentContainerStyle,
  style,
  ...flatListProps
}: FlatListProps<T>) {
  const { paddingTop, paddingBottom, scrollInsetBottom } = useScreenInsets();

  return (
    <FlatList
      style={[
        styles.container,
        { backgroundColor: Colors.dark.backgroundRoot },
        style,
      ]}
      contentContainerStyle={[
        {
          paddingTop,
          paddingBottom,
        },
        styles.contentContainer,
        contentContainerStyle,
      ]}
      scrollIndicatorInsets={{ bottom: scrollInsetBottom }}
      {...flatListProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
  },
});
