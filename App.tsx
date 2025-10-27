import "react-native-gesture-handler";
import "react-native-get-random-values";
import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

const navTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: "#ffffff"
    }
};

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <NavigationContainer theme={navTheme}>
                    <RootNavigator />
                    <StatusBar style="auto" />
                </NavigationContainer>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
