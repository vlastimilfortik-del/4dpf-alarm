import { ScrollView, ScrollViewProps, StyleSheet } from "react-native";

import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Colors, Spacing } from "@/constants/theme";

export function ScreenScrollView({
  children,
  contentContainerStyle,
  style,
  ...scrollViewProps
}: ScrollViewProps) {
  const { paddingTop, paddingBottom, scrollInsetBottom } = useScreenInsets();

  return (
    <ScrollView
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
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
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
