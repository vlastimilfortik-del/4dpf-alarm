import { View, type ViewProps } from "react-native";

import { Colors } from "@/constants/theme";

export type ThemedViewProps = ViewProps & {
  elevation?: 0 | 1 | 2 | 3;
};

export function ThemedView({
  style,
  elevation = 0,
  ...otherProps
}: ThemedViewProps) {
  const getBackgroundColor = () => {
    switch (elevation) {
      case 1:
        return Colors.dark.backgroundDefault;
      case 2:
        return Colors.dark.backgroundSecondary;
      case 3:
        return Colors.dark.backgroundTertiary;
      default:
        return Colors.dark.backgroundRoot;
    }
  };

  return (
    <View
      style={[{ backgroundColor: getBackgroundColor() }, style]}
      {...otherProps}
    />
  );
}
