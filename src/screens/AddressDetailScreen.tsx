import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { Address, Comment } from "@/types/models";
import { subscribeAddress } from "@/services/addressService";
import { addComment, deleteComment, subscribeComments } from "@/services/commentService";

type Props = NativeStackScreenProps<any>;

/** Écran de détail d'une adresse + commentaires */
export default function AddressDetailScreen({ route, navigation }: Props) {
    const { addressId, initialAddress } = (route.params ?? {}) as {
        addressId: string;
        initialAddress?: Address | null;
    };

    const { user, isConfigured } = useAuth();
    const [address, setAddress] = useState<Address | null>(initialAddress ?? null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const canComment = useMemo(() => !!user && !!text.trim() && isConfigured && !submitting, [user, text, isConfigured, submitting]);

    useEffect(() => {
        navigation.setOptions({ title: "Adresse" });
    }, [navigation]);

    // Abonnement aux données de l'adresse
    useEffect(() => {
        if (!isConfigured || !addressId) return;
        const unsub = subscribeAddress(addressId, (a) => {
            setAddress(a);
        });
        return () => unsub?.();
    }, [isConfigured, addressId]);

    // Abonnement aux commentaires
    useEffect(() => {
        if (!isConfigured || !addressId) return;
        const unsub = subscribeComments(addressId, setComments);
        return () => unsub?.();
    }, [isConfigured, addressId]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== ImagePicker.PermissionStatus.GRANTED) {
            Alert.alert("Permission requise", "L’accès à la photothèque est nécessaire pour joindre une photo.");
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

    const onSubmit = async () => {
        if (!canComment || !addressId || !user) return;
        try {
            setSubmitting(true);
            await addComment({
                addressId,
                userId: user.uid,
                authorEmail: user.email ?? null,
                text,
                localImageUri: imageUri
            });
            setText("");
            setImageUri(null);
        } catch (e: any) {
            Alert.alert("Échec", e?.message ?? "Impossible d'ajouter le commentaire.");
        } finally {
            setSubmitting(false);
        }
    };

    const askDeleteComment = (c: Comment) => {
        if (!user || user.uid !== c.userId) return;
        Alert.alert(
            "Supprimer le commentaire",
            "Voulez-vous vraiment supprimer ce commentaire ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteComment({ addressId: c.addressId, commentId: c.id, requesterId: user.uid });
                        } catch (e: any) {
                            Alert.alert("Échec", e?.message ?? "Impossible de supprimer le commentaire.");
                        }
                    }
                }
            ]
        );
    };

    if (!address && isConfigured) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>Adresse introuvable ou supprimée.</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={styles.container}>
                {!isConfigured && (
                    <View style={styles.banner}>
                        <Text style={styles.bannerText}>
                            Firebase n’est pas configuré. Les commentaires sont désactivés.
                        </Text>
                    </View>
                )}

                {/* En-tête adresse */}
                {address ? (
                    <View style={styles.card}>
                        <Text style={styles.title}>{address.name}</Text>
                        <Text style={styles.meta}>
                            {address.isPublic ? "Public" : "Privé"} • {address.latitude.toFixed(5)}, {address.longitude.toFixed(5)}
                        </Text>
                        {address.description ? <Text style={styles.desc}>{address.description}</Text> : null}
                        {address.photoUrl ? (
                            <Image source={{ uri: address.photoUrl }} style={styles.headerImage} />
                        ) : null}
                    </View>
                ) : null}

                {/* Formulaire commentaire */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Ajouter un commentaire</Text>
                    <TextInput
                        placeholder="Votre avis..."
                        style={[styles.input, styles.multiline]}
                        multiline
                        value={text}
                        onChangeText={setText}
                    />

                    {imageUri ? <Image source={{ uri: imageUri }} style={styles.commentImage} /> : null}

                    <View style={styles.row}>
                        <Pressable style={[styles.button, styles.secondary]} onPress={pickImage} disabled={!isConfigured}>
                            <Text style={styles.buttonText}>Joindre une photo</Text>
                        </Pressable>
                        <View style={{ width: 8 }} />
                        <Pressable
                            style={[styles.button, (!canComment) && styles.buttonDisabled]}
                            onPress={onSubmit}
                            disabled={!canComment}
                        >
                            <Text style={styles.buttonText}>{submitting ? "Envoi..." : "Publier"}</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Liste des commentaires */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Commentaires</Text>
                    {comments.length === 0 ? (
                        <Text style={styles.muted}>Aucun commentaire pour le moment.</Text>
                    ) : (
                        comments.map((c) => (
                            <View key={c.id} style={styles.commentItem}>
                                <View style={styles.commentHeader}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarInitial}>{(c.authorEmail?.[0] ?? "?").toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.commentAuthor}>{c.authorEmail ?? "Utilisateur"}</Text>
                                        <Text style={styles.commentDate}>
                                            {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                                        </Text>
                                    </View>
                                    {user?.uid === c.userId ? (
                                        <Pressable onPress={() => askDeleteComment(c)} style={[styles.smallButton, styles.dangerSmall]}>
                                            <Text style={styles.smallButtonText}>Supprimer</Text>
                                        </Pressable>
                                    ) : null}
                                </View>
                                <Text style={styles.commentText}>{c.text}</Text>
                                {c.photoUrl ? <Image source={{ uri: c.photoUrl }} style={styles.commentImage} /> : null}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const AVATAR = 36;

const styles = StyleSheet.create({
    container: { padding: 16, gap: 12 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
    error: { color: "#b00020" },
    banner: { backgroundColor: "#fff3cd", borderColor: "#ffeeba", borderWidth: 1, padding: 10, borderRadius: 8 },
    bannerText: { color: "#856404", fontSize: 13 },

    card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, gap: 10 },
    title: { fontSize: 22, fontWeight: "700" },
    meta: { color: "#6b7280" },
    desc: { color: "#374151" },
    headerImage: { width: "100%", height: 180, borderRadius: 8 },

    sectionTitle: { fontSize: 18, fontWeight: "600" },

    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
    multiline: { minHeight: 80, textAlignVertical: "top" },
    row: { flexDirection: "row", alignItems: "center" },

    button: { backgroundColor: "#1f6feb", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: "center", justifyContent: "center", flex: 1 },
    secondary: { backgroundColor: "#334155" },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", fontWeight: "600" },

    commentItem: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10, gap: 8 },
    commentHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e5e7eb" },
    avatarInitial: { fontWeight: "700", color: "#64748b" },
    commentAuthor: { fontWeight: "600" },
    commentDate: { color: "#6b7280", fontSize: 12 },
    commentText: { color: "#111827" },
    commentImage: { width: "100%", height: 180, borderRadius: 8, backgroundColor: "#f1f5f9" },

    smallButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: "#e5e7eb" },
    smallButtonText: { color: "#fff", fontWeight: "600" },
    dangerSmall: { backgroundColor: "#e11d48", borderColor: "#e11d48" },

    muted: { color: "#6b7280" }
});
