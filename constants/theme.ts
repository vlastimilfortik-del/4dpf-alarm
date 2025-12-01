import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#FFFFFF",
    secondaryText: "#A0A0A8",
    disabledText: "#5A5A5F",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8E8E93",
    tabIconSelected: "#2E7FFF",
    link: "#2E7FFF",
    accent: "#00B4FF",
    backgroundRoot: "#0A0E1A",
    backgroundDefault: "#141B2D",
    backgroundSecondary: "#1A2238",
    backgroundTertiary: "#202942",
    success: "#00C853",
    warning: "#FFB300",
    error: "#FF3B30",
    neutral: "#8E8E93",
    border: "rgba(255, 255, 255, 0.1)",
  },
  dark: {
    text: "#FFFFFF",
    secondaryText: "#A0A0A8",
    disabledText: "#5A5A5F",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8E8E93",
    tabIconSelected: "#2E7FFF",
    link: "#2E7FFF",
    accent: "#00B4FF",
    backgroundRoot: "#0A0E1A",
    backgroundDefault: "#141B2D",
    backgroundSecondary: "#1A2238",
    backgroundTertiary: "#202942",
    success: "#00C853",
    warning: "#FFB300",
    error: "#FF3B30",
    neutral: "#8E8E93",
    border: "rgba(255, 255, 255, 0.1)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  data: {
    fontSize: 24,
    fontWeight: "600" as const,
    fontFamily: Platform.select({
      ios: "ui-monospace",
      default: "monospace",
    }),
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
