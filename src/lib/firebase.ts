import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

export const isFirebaseConfigured =
    Boolean(apiKey) && Boolean(projectId) && Boolean(appId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (isFirebaseConfigured) {
    const appInstance: FirebaseApp =
        getApps().length > 0
            ? getApps()[0]!
            : initializeApp({
                apiKey,
                authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId,
                storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId
            });

    app = appInstance;

    // Si hot-reload: getAuth fonctionne ; sinon on initialise avec persistance RN.
    try {
        auth = getAuth(appInstance);
    } catch {
        auth = initializeAuth(appInstance, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    }
}

export { app, auth };
