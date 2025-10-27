import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User
} from "firebase/auth";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setLoading(false);
            return;
        }
        const unsub = onAuthStateChanged(auth!, (u: User | null) => {
            setUser(u ?? null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            isConfigured: isFirebaseConfigured,
            signIn: async (email: string, password: string) => {
                if (!isFirebaseConfigured) {
                    Alert.alert("Configuration requise", "Firebase n'est pas configuré (.env manquant).");
                    return;
                }
                await signInWithEmailAndPassword(auth!, email.trim(), password);
            },
            signUp: async (email: string, password: string) => {
                if (!isFirebaseConfigured) {
                    Alert.alert("Configuration requise", "Firebase n'est pas configuré (.env manquant).");
                    return;
                }
                await createUserWithEmailAndPassword(auth!, email.trim(), password);
            },
            signOut: async () => {
                if (!isFirebaseConfigured) return;
                await signOut(auth!);
            }
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
