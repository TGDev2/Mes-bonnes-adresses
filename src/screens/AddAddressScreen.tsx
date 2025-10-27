import React, { useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useAuth } from "@/context/AuthContext";
import { createAddress } from "@/services/addressService";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;

export default function AddAddressScreen({ navigation }: Props) {
    const { user, isConfigured } = useAuth();
    const { coords, loading: locLoading, permissionGranted } = useUserLocation();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        return !!user && !!coords && !!name.trim() && isConfigured && !submitting;
    }, [user, coords, name, isConfigured, submitting]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== ImagePicker.PermissionStatus.GRANTED) {
            Alert.alert("Permission requise", "L’accès à la photothèque est nécessaire pour ajouter une photo.");
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.85,
            mediaTypes: ImagePicker.MediaTypeOptions.Images
        });
        if (!res.canceled) {
            setImageUri(res.assets[0]?.uri ?? null);
        }
    };

    const onSave = async () => {
        if (!canSubmit) return;
        try {
            setSubmitting(true);
            await createAddress({
                userId: user!.uid,
                name,
                description,
                isPublic,
                latitude: coords!.latitude,
                longitude: coords!.longitude,
                localImageUri: imageUri
            });
            Alert.alert("Adresse créée", "Votre adresse a été ajoutée.");
            navigation.goBack();
        } catch (e: any) {
            Alert.alert("Échec", e?.message ?? "Impossible de créer l’adresse.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {!isConfigured && (
                <View style={styles.banner}>
                    <Text style={styles.bannerText}>
                        Firebase n’est pas configuré. Renseignez `.env` pour activer l’enregistrement des adresses.
                    </Text>
                </View>
            )}

            <Text style={styles.title}>Ajouter une adresse</Text>

            <Text style={styles.label}>Nom *</Text>
            <TextInput
                placeholder="ex: Café de la Paix"
                value={name}
                onChangeText={setName}
                style={styles.input}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                placeholder="Notes, spécialités, horaires…"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.multiline]}
                multiline
            />

            <View style={styles.row}>
                <Text style={styles.label}>Rendre publique</Text>
                <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>

            <Text style={styles.label}>Photo</Text>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photo} />
            ) : (
                <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>Aucune photo</Text>
                </View>
            )}
            <Pressable onPress={pickImage} style={[styles.button, styles.secondary]}>
                <Text style={styles.buttonText}>Choisir une photo</Text>
            </Pressable>

            <View style={{ height: 8 }} />

            <Pressable
                onPress={onSave}
                disabled={!canSubmit || locLoading || permissionGranted === false}
                style={[styles.button, (!canSubmit || locLoading) && styles.buttonDisabled]}
            >
                <Text style={styles.buttonText}>
                    {submitting ? "Enregistrement…" : "Enregistrer l’adresse"}
                </Text>
            </Pressable>

            <Text style={styles.help}>
                * Votre position actuelle sera utilisée comme coordonnées.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, gap: 12 },
    title: { fontSize: 22, fontWeight: "600", textAlign: "center", marginBottom: 8 },
    label: { color: "#444", fontSize: 14, marginTop: 8 },
    input: {
        borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, backgroundColor: "#fff"
    },
    multiline: { minHeight: 80, textAlignVertical: "top" },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    button: { backgroundColor: "#1f6feb", padding: 12, borderRadius: 8, alignItems: "center" },
    secondary: { backgroundColor: "#334155" },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", fontWeight: "600" },
    photo: { width: "100%", height: 180, borderRadius: 8, backgroundColor: "#eee" },
    photoPlaceholder: {
        height: 180, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e5e7eb"
    },
    photoPlaceholderText: { color: "#6b7280" },
    help: { color: "#6b7280", fontSize: 12, marginTop: 8 },
    banner: {
        backgroundColor: "#fff3cd",
        borderColor: "#ffeeba",
        borderWidth: 1,
        padding: 10,
        borderRadius: 8
    },
    bannerText: { color: "#856404", fontSize: 13 }
});
