import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<any>;

export default function SignInScreen({ navigation }: Props) {
    const { signIn, isConfigured } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async () => {
        try {
            setSubmitting(true);
            await signIn(email, password);
        } catch (e: any) {
            Alert.alert("Connexion impossible", e?.message ?? "Erreur inconnue");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {!isConfigured && (
                <View style={styles.banner}>
                    <Text style={styles.bannerText}>
                        Firebase n’est pas encore configuré. Renseignez `.env` pour activer l’authentification.
                    </Text>
                </View>
            )}
            <Text style={styles.title}>Connexion</Text>
            <TextInput
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
                <Text style={styles.buttonText}>{submitting ? "..." : "Se connecter"}</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate("Créer un compte")}>
                <Text style={styles.link}>Créer un compte</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 12 },
    title: { fontSize: 24, fontWeight: "600", textAlign: "center", marginVertical: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12
    },
    button: {
        backgroundColor: "#1f6feb",
        padding: 12,
        borderRadius: 8,
        alignItems: "center"
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", fontWeight: "600" },
    link: { color: "#1f6feb", textAlign: "center", marginTop: 8 },
    banner: {
        backgroundColor: "#fff3cd",
        borderColor: "#ffeeba",
        borderWidth: 1,
        padding: 10,
        borderRadius: 8
    },
    bannerText: { color: "#856404", fontSize: 13 }
});
