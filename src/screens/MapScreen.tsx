import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View, Image } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useUserLocation } from "../hooks/useUserLocation";
import { useAuth } from "@/context/AuthContext";
import { Address } from "@/types/models";
import { subscribePublicAddresses, subscribeUserAddresses, deleteAddress } from "@/services/addressService";
import { getCommentsCount } from "@/services/commentService";
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

    // 👉 fiche sélectionnée (remplace le Callout)
    const [selected, setSelected] = useState<Address | null>(null);

    // 👉 cache des compteurs de commentaires
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

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
        const map = new Map<string, Address>();
        for (const a of publicAddresses) map.set(a.id, a);
        for (const a of myAddresses) map.set(a.id, a);
        return Array.from(map.values());
    }, [publicAddresses, myAddresses]);

    // 👉 Récupère les compteurs (best effort) quand la liste change
    useEffect(() => {
        if (!isConfigured) return;
        let canceled = false;
        (async () => {
            for (const a of allMarkers) {
                if (commentCounts[a.id] !== undefined) continue;
                try {
                    const n = await getCommentsCount(a.id);
                    if (!canceled) {
                        setCommentCounts((prev) => ({ ...prev, [a.id]: n }));
                    }
                } catch {
                    // silencieux : compteur non bloquant
                }
            }
        })();
        return () => {
            canceled = true;
        };
    }, [isConfigured, allMarkers, commentCounts]);

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
                            setSelected(null);
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

    const openDetails = (a: Address) => {
        navigation.navigate("Adresse", { addressId: a.id, initialAddress: a });
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
                        onPress={() => setSelected(a)}
                        title={a.name} // petite info native si besoin
                        description={a.isPublic ? "Public" : "Privé"}
                    />
                ))}
            </MapView>

            {/* Overlay fiche adresse – remplace le Callout natif */}
            {selected && (
                <View style={styles.cardOverlay} pointerEvents="box-none">
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{selected.name}</Text>
                            <Pressable onPress={() => setSelected(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={18} color="#111827" />
                            </Pressable>
                        </View>
                        <Text style={styles.cardMeta}>
                            {selected.isPublic ? "Public" : "Privé"} • {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                        </Text>

                        {selected.photoUrl ? (
                            <Image source={{ uri: selected.photoUrl }} style={styles.cardImage} />
                        ) : null}

                        <Text style={styles.cardCounter}>
                            {commentCounts[selected.id] ?? 0} commentaire{(commentCounts[selected.id] ?? 0) > 1 ? "s" : ""}
                        </Text>

                        <View style={styles.cardActions}>
                            <Pressable onPress={() => openDetails(selected)} style={[styles.button, styles.primaryButton]}>
                                <Text style={styles.buttonText}>Commentaires</Text>
                            </Pressable>
                            {user?.uid === selected.userId ? (
                                <Pressable
                                    onPress={() => handleAskDelete(selected)}
                                    style={[
                                        styles.button,
                                        styles.dangerButton,
                                        (deletingId === selected.id || !isConfigured) && styles.buttonDisabled
                                    ]}
                                    disabled={deletingId === selected.id || !isConfigured}
                                >
                                    <Text style={styles.buttonText}>
                                        {deletingId === selected.id ? "Suppression…" : "Supprimer"}
                                    </Text>
                                </Pressable>
                            ) : null}
                        </View>
                    </View>
                </View>
            )}

            {error ? <Text style={[styles.muted, styles.bottomInfo]}>{error}</Text> : null}

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

    // Overlay card
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end"
    },
    card: {
        margin: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }
    },
    cardHeader: { flexDirection: "row", alignItems: "center" },
    cardTitle: { fontSize: 18, fontWeight: "700", flex: 1 },
    closeBtn: { padding: 6, marginLeft: 8, borderRadius: 6, backgroundColor: "#f3f4f6" },
    cardMeta: { color: "#6b7280", marginTop: 4 },
    cardImage: { width: "100%", height: 160, borderRadius: 8, marginTop: 8, backgroundColor: "#f1f5f9" },
    cardCounter: { marginTop: 8, color: "#111827", fontWeight: "600" },
    cardActions: { flexDirection: "row", marginTop: 10, columnGap: 8 },

    // Boutons
    button: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center"
    },
    primaryButton: { backgroundColor: "#1f6feb" },
    dangerButton: { backgroundColor: "#e11d48" },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", fontWeight: "600" }
});
