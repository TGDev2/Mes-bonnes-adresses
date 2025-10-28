import { Alert } from "react-native";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import { db, isFirebaseConfigured, storage } from "@/lib/firebase";
import { Comment } from "@/types/models";

function ensureConfigured() {
    if (!isFirebaseConfigured || !db || !storage) {
        Alert.alert("Configuration requise", "Firebase n'est pas configuré (.env manquant).");
        throw new Error("Firebase not configured");
    }
}

async function uploadCommentImageIfAny(addressId: string, userId: string, localUri?: string | null): Promise<string | null> {
    if (!localUri) return null;
    ensureConfigured();
    const response = await fetch(localUri);
    const blob = await response.blob();
    const key = `addressComments/${addressId}/${userId}/${Date.now()}.jpg`;
    const storageRef = ref(storage!, key);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    return await getDownloadURL(storageRef);
}

function mapSnapToComments(snap: any, addressId: string): Comment[] {
    return snap.docs.map((d: any) => {
        const data = d.data();
        return {
            id: d.id,
            addressId,
            userId: data.userId,
            authorEmail: data.authorEmail ?? null,
            text: data.text,
            photoUrl: data.photoUrl ?? null,
            createdAt: (data.createdAt?.toMillis?.() as number | undefined) ?? undefined
        } as Comment;
    });
}

export function subscribeComments(addressId: string, onChange: (comments: Comment[]) => void): () => void {
    ensureConfigured();
    const q = query(
        collection(db!, "addresses", addressId, "comments"),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => onChange(mapSnapToComments(snap, addressId)));
}

export async function addComment(params: {
    addressId: string;
    userId: string;
    authorEmail?: string | null;
    text: string;
    localImageUri?: string | null;
}): Promise<string> {
    ensureConfigured();
    const trimmed = params.text.trim();
    if (!trimmed) throw new Error("Le commentaire ne peut pas être vide.");

    const photoUrl = await uploadCommentImageIfAny(params.addressId, params.userId, params.localImageUri);

    const refCol = collection(db!, "addresses", params.addressId, "comments");
    const docRef = await addDoc(refCol, {
        userId: params.userId,
        authorEmail: params.authorEmail ?? null,
        text: trimmed,
        photoUrl: photoUrl ?? null,
        createdAt: serverTimestamp()
    });

    return docRef.id;
}

export async function deleteComment(params: {
    addressId: string;
    commentId: string;
    requesterId: string;
}): Promise<void> {
    ensureConfigured();

    const cref = doc(db!, "addresses", params.addressId, "comments", params.commentId);
    const snap = await getDoc(cref);
    if (!snap.exists()) throw new Error("Commentaire introuvable.");

    const data = snap.data();
    if (data.userId !== params.requesterId) throw new Error("Vous ne pouvez supprimer que vos propres commentaires.");

    // Essai de suppression de la photo reliée (si photoUrl stockée)
    const photoUrl: string | null | undefined = data.photoUrl ?? null;
    if (photoUrl) {
        try {
            const sref = ref(storage!, photoUrl);
            await deleteObject(sref);
        } catch {
            // nettoyage best effort
        }
    }

    await deleteDoc(cref);
}
