import { Text, type TextProps } from "react-native";

import { Typography, Colors } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "caption" | "link" | "data";
  color?: "primary" | "secondary" | "disabled" | "accent" | "success" | "warning" | "error";
};

export function ThemedText({
  style,
  type = "body",
  color = "primary",
  ...rest
}: ThemedTextProps) {
  const getColor = () => {
    switch (color) {
      case "secondary":
        return Colors.dark.secondaryText;
      case "disabled":
        return Colors.dark.disabledText;
      case "accent":
        return Colors.dark.accent;
      case "success":
        return Colors.dark.success;
      case "warning":
        return Colors.dark.warning;
      case "error":
        return Colors.dark.error;
      default:
        return Colors.dark.text;
    }
  };

  const getTypeStyle = () => {
    switch (type) {
      case "h1":
        return Typography.h1;
      case "h2":
        return Typography.h2;
      case "h3":
        return Typography.h3;
      case "h4":
        return Typography.h4;
      case "body":
        return Typography.body;
      case "small":
        return Typography.small;
      case "caption":
        return Typography.caption;
      case "link":
        return { ...Typography.link, color: Colors.dark.link };
      case "data":
        return Typography.data;
      default:
        return Typography.body;
    }
  };

  return (
    <Text style={[{ color: getColor() }, getTypeStyle(), style]} {...rest} />
  );
}
