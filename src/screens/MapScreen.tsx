import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region, Callout } from "react-native-maps";
import { useUserLocation } from "../hooks/useUserLocation";
import { useAuth } from "@/context/AuthContext";
import { Address } from "@/types/models";
import { subscribePublicAddresses, subscribeUserAddresses, deleteAddress } from "@/services/addressService";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const DEFAULT_REGION: Region = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
};

export default function MapScreen() {
    const navigation = useNavigation<any>();
    const { coords, loading, error, permissionGranted } = useUserLocation();
    const { user, isConfigured } = useAuth();

    const [publicAddresses, setPublicAddresses] = useState<Address[]>([]);
    const [myAddresses, setMyAddresses] = useState<Address[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isConfigured) return;
        const unsubs: Array<() => void> = [];
        unsubs.push(subscribePublicAddresses(setPublicAddresses));
        if (user) {
            unsubs.push(subscribeUserAddresses(user.uid, setMyAddresses));
        } else {
            setMyAddresses([]);
        }
        return () => {
            unsubs.forEach((u) => u());
        };
    }, [isConfigured, user?.uid]);

    const region: Region = useMemo(() => {
        if (coords) {
            return {
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015
            };
        }
        return DEFAULT_REGION;
    }, [coords]);

    const allMarkers: Address[] = useMemo(() => {
        // Fusionne sans doublons (publique + mienne)
        const map = new Map<string, Address>();
        for (const a of publicAddresses) map.set(a.id, a);
        for (const a of myAddresses) map.set(a.id, a);
        return Array.from(map.values());
    }, [publicAddresses, myAddresses]);

    const handleAskDelete = (a: Address) => {
        if (!user || user.uid !== a.userId) return;
        if (!isConfigured) {
            Alert.alert("Configuration requise", "Firebase n'est pas configuré (.env manquant).");
            return;
        }
        Alert.alert(
            "Supprimer l’adresse",
            `Voulez-vous vraiment supprimer « ${a.name} » ? Cette action est irréversible.`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeletingId(a.id);
                            await deleteAddress({ id: a.id, requesterId: user.uid });
                        } catch (e: any) {
                            Alert.alert("Échec", e?.message ?? "Impossible de supprimer l’adresse.");
                        } finally {
                            setDeletingId(null);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Localisation en cours…</Text>
            </View>
        );
    }

    if (permissionGranted === false) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>
                    La permission de localisation est nécessaire pour centrer la carte.
                    Vous pouvez l’activer dans les réglages de l’appareil.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView style={styles.map} initialRegion={region} showsUserLocation>
                {coords && <Marker coordinate={coords} title="Ma position" />}
                {allMarkers.map((a) => (
                    <Marker
                        key={a.id}
                        coordinate={{ latitude: a.latitude, longitude: a.longitude }}
                        title={a.name}
                        description={a.isPublic ? "Public" : "Privé"}
                    >
                        <Callout>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{a.name}</Text>
                                {a.description ? <Text style={styles.calloutDesc}>{a.description}</Text> : null}
                                <Text style={styles.calloutMeta}>{a.isPublic ? "Public" : "Privé"}</Text>

                                {user?.uid === a.userId ? (
                                    <Pressable
                                        onPress={() => handleAskDelete(a)}
                                        style={[
                                            styles.button,
                                            styles.dangerButton,
                                            (deletingId === a.id || !isConfigured) && styles.buttonDisabled
                                        ]}
                                        disabled={deletingId === a.id || !isConfigured}
                                    >
                                        <Text style={styles.buttonText}>
                                            {deletingId === a.id ? "Suppression…" : "Supprimer"}
                                        </Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
            {error ? <Text style={[styles.muted, styles.bottomInfo]}>{error}</Text> : null}

            {/* Bouton flottant “Ajouter” */}
            <Pressable
                onPress={() => navigation.navigate("Ajouter une adresse")}
                style={styles.fab}
                disabled={!isConfigured}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </Pressable>

            {!isConfigured && (
                <Text style={[styles.muted, styles.bottomInfo]}>
                    Firebase non configuré — ajout, suppression & synchro désactivés.
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
    error: { textAlign: "center", color: "#b00020" },
    muted: { marginTop: 8, color: "#666" },
    bottomInfo: {
        position: "absolute",
        bottom: 8,
        alignSelf: "center",
        backgroundColor: "rgba(255,255,255,0.9)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    fab: {
        position: "absolute",
        right: 16,
        bottom: 24,
        width: 56,
        height: 56,
        backgroundColor: "#1f6feb",
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 }
    },

    // Callout
    callout: { maxWidth: 240, gap: 6 },
    calloutTitle: { fontWeight: "700", fontSize: 16 },
    calloutDesc: { color: "#374151" },
    calloutMeta: { color: "#6b7280", fontSize: 12 },

    // Boutons dans le callout
    button: {
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: "center"
    },
    dangerButton: { backgroundColor: "#e11d48" },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", fontWeight: "600" }
});
