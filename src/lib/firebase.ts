import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { initializeAuth, getReactNativePersistence } from "firebase/auth/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

export const isFirebaseConfigured =
    Boolean(apiKey) && Boolean(projectId) && Boolean(appId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

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

    // RN/Expo : on initialise l'auth avec persistance AsyncStorage.
    // En hot-reload (ou si déjà initialisé), on fallback sur getAuth.
    try {
        auth = initializeAuth(appInstance, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    } catch {
        auth = getAuth(appInstance);
    }

    db = getFirestore(appInstance);
    storage = getStorage(appInstance);
}

export { app, auth, db, storage };
