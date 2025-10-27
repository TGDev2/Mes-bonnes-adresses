import { useEffect, useState } from "react";
import * as Location from "expo-location";

export type Coordinates = {
    latitude: number;
    longitude: number;
};

export function useUserLocation() {
    const [coords, setCoords] = useState<Coordinates | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                const granted = status === Location.PermissionStatus.GRANTED;
                setPermissionGranted(granted);

                if (!granted) {
                    setError("Permission de localisation refusée.");
                    setLoading(false);
                    return;
                }

                const current = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                setCoords({
                    latitude: current.coords.latitude,
                    longitude: current.coords.longitude
                });
            } catch (e: any) {
                setError(e?.message ?? "Erreur de localisation");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return { coords, permissionGranted, loading, error };
}
