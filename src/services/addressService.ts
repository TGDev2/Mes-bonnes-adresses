import { Alert } from "react-native";
import {
  addDoc,
  collection,
  GeoPoint,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  deleteDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import { db, storage, isFirebaseConfigured } from "@/lib/firebase";
import { Address } from "@/types/models";

type CreateAddressInput = {
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  latitude: number;
  longitude: number;
  localImageUri?: string | null;
};

function ensureConfigured() {
  if (!isFirebaseConfigured || !db || !storage) {
    Alert.alert("Configuration requise", "Firebase n'est pas configuré (.env manquant).");
    throw new Error("Firebase not configured");
  }
}

async function uploadImageIfAny(userId: string, localUri?: string | null): Promise<string | null> {
  if (!localUri) return null;
  ensureConfigured();

  const response = await fetch(localUri);
  const blob = await response.blob();

  // Identifiant de fichier simple et sûr
  const randomPart = Math.random().toString(36).slice(2);
  const key = `addresses/${userId}/${Date.now()}-${randomPart}.jpg`;

  const storageRef = ref(storage!, key);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return url;
}

export async function createAddress(input: CreateAddressInput): Promise<string> {
  ensureConfigured();

  const photoUrl = await uploadImageIfAny(input.userId, input.localImageUri);

  const docRef = await addDoc(collection(db!, "addresses"), {
    userId: input.userId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    isPublic: !!input.isPublic,
    photoUrl: photoUrl ?? null,
    location: new GeoPoint(input.latitude, input.longitude),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

function mapSnapToAddresses(snap: any): Address[] {
  return snap.docs.map((d: any) => {
    const data = d.data();
    const gp = data.location as GeoPoint | undefined;
    return {
      id: d.id,
      userId: data.userId,
      name: data.name,
      description: data.description ?? undefined,
      isPublic: !!data.isPublic,
      photoUrl: data.photoUrl ?? null,
      latitude: gp ? gp.latitude : 0,
      longitude: gp ? gp.longitude : 0,
      createdAt: (data.createdAt?.toMillis?.() as number | undefined) ?? undefined
    } as Address;
  });
}

/** Adresses publiques (tous les utilisateurs) */
export function subscribePublicAddresses(
  onChange: (addresses: Address[]) => void
): () => void {
  ensureConfigured();
  const q = query(collection(db!, "addresses"), where("isPublic", "==", true));
  return onSnapshot(q, (snap) => onChange(mapSnapToAddresses(snap)));
}

/** Adresses de l'utilisateur courant (privées et publiques) */
export function subscribeUserAddresses(
  userId: string,
  onChange: (addresses: Address[]) => void
): () => void {
  ensureConfigured();
  const q = query(collection(db!, "addresses"), where("userId", "==", userId));
  return onSnapshot(q, (snap) => onChange(mapSnapToAddresses(snap)));
}

/** S'abonner à une adresse par ID (détail) */
export function subscribeAddress(
  addressId: string,
  onChange: (address: Address | null) => void
): () => void {
  ensureConfigured();
  const dref = doc(db!, "addresses", addressId);
  return onSnapshot(dref, (snap) => {
    if (!snap.exists()) return onChange(null);
    const data = snap.data();
    const gp = data.location as GeoPoint | undefined;
    onChange({
      id: snap.id,
      userId: data.userId,
      name: data.name,
      description: data.description ?? undefined,
      isPublic: !!data.isPublic,
      photoUrl: data.photoUrl ?? null,
      latitude: gp ? gp.latitude : 0,
      longitude: gp ? gp.longitude : 0,
      createdAt: (data.createdAt?.toMillis?.() as number | undefined) ?? undefined
    });
  });
}

/** Suppression d'une adresse (réservée au propriétaire) + suppression éventuelle de la photo. */
export async function deleteAddress(params: { id: string; requesterId: string }): Promise<void> {
  ensureConfigured();

  const dref = doc(db!, "addresses", params.id);
  const snap = await getDoc(dref);
  if (!snap.exists()) {
    throw new Error("Adresse introuvable.");
  }

  const data = snap.data();
  if (data.userId !== params.requesterId) {
    throw new Error("Vous ne pouvez supprimer que vos propres adresses.");
  }

  const photoUrl: string | null | undefined = data.photoUrl ?? null;
  // On essaie de supprimer la photo si elle existe (on ignore les erreurs de nettoyage)
  if (photoUrl) {
    try {
      // La ref peut être créée à partir de l'URL publique
      const sref = ref(storage!, photoUrl);
      await deleteObject(sref);
    } catch {
      // Pas bloquant
    }
  }

  await deleteDoc(dref);
}
