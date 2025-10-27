export type Address = {
    id: string;
    userId: string;
    name: string;
    description?: string;
    isPublic: boolean;
    photoUrl?: string | null;
    latitude: number;
    longitude: number;
    createdAt?: number; // timestamp ms (facultatif pour affichage/local tri)
};
