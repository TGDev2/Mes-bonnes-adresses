import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useUserLocation } from "../hooks/useUserLocation";

const DEFAULT_REGION: Region = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
};

export default function MapScreen() {
    const { coords, loading, error, permissionGranted } = useUserLocation();

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
                {coords && (
                    <Marker coordinate={coords} title="Ma position" />
                )}
            </MapView>
            {error ? <Text style={[styles.muted, styles.bottomInfo]}>{error}</Text> : null}
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
    }
});
