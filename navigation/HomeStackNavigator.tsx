import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import VehicleDetailScreen from "@/screens/VehicleDetailScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type HomeStackParamList = {
  Home: undefined;
  VehicleDetail: { brand: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="VAG Diagnostics" />,
        }}
      />
      <Stack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={({ route }) => ({
          headerTitle: route.params.brand,
        })}
      />
    </Stack.Navigator>
  );
}
