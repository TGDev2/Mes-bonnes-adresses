import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

export const isFirebaseConfigured =
    Boolean(apiKey) && Boolean(projectId) && Boolean(appId);

let app: FirebaseApp | undefined;
// Type sans référencer explicitement `Auth` (évite les soucis de d.ts)
type RNAuth = ReturnType<typeof FirebaseAuth.getAuth>;
let auth: RNAuth | undefined;
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

    // Initialisation Auth robuste pour RN/Expo :
    // - Si getReactNativePersistence est dispo (runtime), on l'utilise
    // - Sinon, fallback sur getAuth (aucune persistance RN custom)
    try {
        const getRNPersistence = (FirebaseAuth as any).getReactNativePersistence;
        if (typeof getRNPersistence === "function") {
            auth = FirebaseAuth.initializeAuth(appInstance, {
                persistence: getRNPersistence(AsyncStorage)
            });
        } else {
            auth = FirebaseAuth.getAuth(appInstance);
        }
    } catch {
        auth = FirebaseAuth.getAuth(appInstance);
    }

    db = getFirestore(appInstance);
    storage = getStorage(appInstance);
}

export { app, auth, db, storage };
