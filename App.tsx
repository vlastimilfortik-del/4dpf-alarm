import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Colors } from "@/constants/theme";

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <NavigationContainer
              theme={{
                dark: true,
                colors: {
                  primary: Colors.dark.link,
                  background: Colors.dark.backgroundRoot,
                  card: Colors.dark.backgroundDefault,
                  text: Colors.dark.text,
                  border: Colors.dark.border,
                  notification: Colors.dark.link,
                },
                fonts: {
                  regular: { fontFamily: "System", fontWeight: "400" },
                  medium: { fontFamily: "System", fontWeight: "500" },
                  bold: { fontFamily: "System", fontWeight: "700" },
                  heavy: { fontFamily: "System", fontWeight: "900" },
                },
              }}
            >
              <MainTabNavigator />
            </NavigationContainer>
            <StatusBar style="light" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
});
