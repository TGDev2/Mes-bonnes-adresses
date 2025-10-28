import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { uploadUserProfilePhoto } from "@/services/userService";

export default function ProfileScreen() {
    const { user, signOut, isConfigured } = useAuth();
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Suivre le photoURL du user; on prend une copie locale pour forcer un rerender après updateProfile
    useEffect(() => {
        setPhotoUrl(user?.photoURL ?? null);
    }, [user?.photoURL]);

    const pickAndUpload = async () => {
        if (!user) return;
        if (!isConfigured) {
            Alert.alert("Configuration requise", "Firebase n'est pas configuré (.env manquant).");
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== ImagePicker.PermissionStatus.GRANTED) {
            Alert.alert("Permission requise", "L'accès à la photothèque est nécessaire pour la photo de profil.");
            return;
        }

        const res = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
            mediaTypes: ImagePicker.MediaTypeOptions.Images
        });
        if (res.canceled) return;

        const localUri = res.assets[0]?.uri;
        if (!localUri) return;

        try {
            setUploading(true);
            const url = await uploadUserProfilePhoto(user.uid, localUri);
            await updateProfile(user, { photoURL: url });
            setPhotoUrl(url);
            Alert.alert("Photo mise à jour", "Votre photo de profil a été mise à jour.");
        } catch (e: any) {
            Alert.alert("Échec", e?.message ?? "Impossible de mettre à jour la photo de profil.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profil</Text>

            {user ? (
                <>
                    <View style={styles.avatarRow}>
                        {photoUrl ? (
                            <Image source={{ uri: photoUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarInitials}>
                                    {user.email?.[0]?.toUpperCase() ?? "?"}
                                </Text>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{user.email}</Text>
                        </View>
                    </View>

                    <Pressable
                        style={[styles.button, (!isConfigured || uploading) && styles.buttonDisabled]}
                        onPress={pickAndUpload}
                        disabled={!isConfigured || uploading}
                    >
                        <Text style={styles.buttonText}>
                            {uploading ? "Envoi en cours…" : (photoUrl ? "Changer la photo" : "Ajouter une photo")}
                        </Text>
                    </Pressable>

                    <Pressable style={[styles.buttonDanger]} onPress={signOut} disabled={!isConfigured}>
                        <Text style={styles.buttonText}>Se déconnecter</Text>
                    </Pressable>
                </>
            ) : (
                <Text style={styles.value}>Non connecté</Text>
            )}
        </View>
    );
}

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 12 },
    title: { fontSize: 24, fontWeight: "600", textAlign: "center", marginBottom: 12 },
    label: { color: "#666", fontSize: 13 },
    value: { fontSize: 16 },
    avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: "#e5e7eb",
        borderWidth: 1,
        borderColor: "#e5e7eb"
    },
    avatarPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitials: { fontSize: 28, color: "#64748b", fontWeight: "700" },
    button: {
        backgroundColor: "#1f6feb",
        padding: 12,
        borderRadius: 8,
        alignItems: "center"
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", fontWeight: "600" },
    buttonDanger: {
        marginTop: 8,
        backgroundColor: "#e11d48",
        padding: 12,
        borderRadius: 8,
        alignItems: "center"
    }
});
