import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DiagnosticsScreen from "@/screens/DiagnosticsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type DiagnosticsStackParamList = {
  Diagnostics: undefined;
};

const Stack = createNativeStackNavigator<DiagnosticsStackParamList>();

export default function DiagnosticsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark, transparent: false }),
      }}
    >
      <Stack.Screen
        name="Diagnostics"
        component={DiagnosticsScreen}
        options={{
          headerTitle: "DPF Regeneration",
        }}
      />
    </Stack.Navigator>
  );
}
