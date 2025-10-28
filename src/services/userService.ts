// src/services/userService.ts
import { Alert } from "react-native";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { isFirebaseConfigured, storage } from "@/lib/firebase";

/** Vérifie la configuration Firebase et lève une erreur bloquante si absente. */
function ensureConfigured() {
    if (!isFirebaseConfigured || !storage) {
        Alert.alert("Configuration requise", "Firebase n'est pas configuré (.env manquant).");
        throw new Error("Firebase not configured");
    }
}

/**
 * Upload la photo de profil de l'utilisateur vers Storage et retourne l'URL publique.
 * - Ecrit à l'emplacement stable: users/{userId}/profile.jpg (remplacement idempotent)
 */
export async function uploadUserProfilePhoto(userId: string, localUri: string): Promise<string> {
    ensureConfigured();
    if (!localUri) throw new Error("URI de l'image invalide.");

    // RN/Expo: fetch(localUri) -> blob fonctionne pour les URIs file:/content:
    const response = await fetch(localUri);
    const blob = await response.blob();

    const key = `users/${userId}/profile.jpg`;
    const storageRef = ref(storage!, key);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

    const url = await getDownloadURL(storageRef);
    return url;
}
