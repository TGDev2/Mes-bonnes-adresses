import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
    const { user, signOut, isConfigured } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profil</Text>
            {user ? (
                <>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user.email}</Text>
                    <Pressable style={styles.button} onPress={signOut} disabled={!isConfigured}>
                        <Text style={styles.buttonText}>Se déconnecter</Text>
                    </Pressable>
                </>
            ) : (
                <Text style={styles.value}>Non connecté</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 12 },
    title: { fontSize: 24, fontWeight: "600", textAlign: "center", marginBottom: 12 },
    label: { color: "#666", fontSize: 13 },
    value: { fontSize: 16 },
    button: {
        marginTop: 16,
        backgroundColor: "#e11d48",
        padding: 12,
        borderRadius: 8,
        alignItems: "center"
    },
    buttonText: { color: "#fff", fontWeight: "600" }
});
