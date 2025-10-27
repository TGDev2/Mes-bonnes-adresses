import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import MapScreen from "../screens/MapScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AddAddressScreen from "@/screens/AddAddressScreen";

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }: { route: { name: string } }) => ({
                headerTitleAlign: "center",
                tabBarIcon: ({ focused, size, color }: { focused: boolean; size: number; color: string }) => {
                    const name =
                        route.name === "Carte" ? (focused ? "map" : "map-outline")
                            : route.name === "Profil" ? (focused ? "person" : "person-outline")
                                : "ellipse-outline";
                    return <Ionicons name={name as any} size={size} color={color} />;
                },
                tabBarLabelStyle: { fontSize: 12 }
            })}
        >
            <Tab.Screen name="Carte" component={MapScreen} />
            <Tab.Screen name="Profil" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export function RootNavigator() {
    const { user } = useAuth();

    return user ? (
        <Stack.Navigator>
            <Stack.Screen name="App" component={AppTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Ajouter une adresse" component={AddAddressScreen} />
        </Stack.Navigator>
    ) : (
        <AuthStack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
            <AuthStack.Screen name="Se connecter" component={SignInScreen} />
            <AuthStack.Screen name="Créer un compte" component={SignUpScreen} />
        </AuthStack.Navigator>
    );
}
