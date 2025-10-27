import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useUserLocation } from "../hooks/useUserLocation";
import { useAuth } from "@/context/AuthContext";
import { Address } from "@/types/models";
import { subscribePublicAddresses, subscribeUserAddresses } from "@/services/addressService";
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

    useEffect(() => {
        if (!isConfigured) return;
        const unsubs: Array<() => void> = [];
        unsubs.push(subscribePublicAddresses(setPublicAddresses));
        if (user) {
            unsubs.push(subscribeUserAddresses(user.uid, setMyAddresses));
        } else {
            setMyAddresses([]);
        }
        return () => { unsubs.forEach(u => u()); };
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
        // Fusionner sans doublons (une même adresse pourrait satisfaire 2 abonnements si publique + mienne)
        const map = new Map<string, Address>();
        for (const a of publicAddresses) map.set(a.id, a);
        for (const a of myAddresses) map.set(a.id, a);
        return Array.from(map.values());
    }, [publicAddresses, myAddresses]);

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
                    />
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
                <Text style={[styles.muted, styles.bottomInfo]}>Firebase non configuré — ajout & synchro désactivés.</Text>
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
        width: 56, height: 56,
        backgroundColor: "#1f6feb",
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 }
    }
});
