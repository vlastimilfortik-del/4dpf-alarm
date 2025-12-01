import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "@/screens/SettingsScreen";
import BluetoothPairingScreen from "@/screens/BluetoothPairingScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type SettingsStackParamList = {
  Settings: undefined;
  BluetoothPairing: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark, transparent: false }),
      }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
        }}
      />
      <Stack.Screen
        name="BluetoothPairing"
        component={BluetoothPairingScreen}
        options={{
          headerTitle: "Bluetooth Devices",
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
}
