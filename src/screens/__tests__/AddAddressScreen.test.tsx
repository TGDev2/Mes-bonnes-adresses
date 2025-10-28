import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

// -- Mocks d'abord (avant tout import du module testé) -------------------------
const mockAuth: any = {
    isConfigured: true,
    user: { uid: "user-1", email: "u1@example.com" }
};

jest.mock("@/context/AuthContext", () => ({
    useAuth: () => mockAuth
}));

jest.mock("@/hooks/useUserLocation", () => ({
    useUserLocation: () => ({
        coords: { latitude: 48.8566, longitude: 2.3522 },
        permissionGranted: true,
        loading: false,
        error: null
    })
}));

const mockCreateAddress = jest.fn().mockResolvedValue("addr-1");
jest.mock("@/services/addressService", () => ({
    createAddress: mockCreateAddress
}));

// -----------------------------------------------------------------------------

// Importer le module testé APRÈS les mocks
import AddAddressScreen from "../AddAddressScreen";

jest.spyOn(Alert, "alert").mockImplementation(() => { });

describe("AddAddressScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("active le bouton et crée une adresse avec les bonnes données", async () => {
        const navigation: any = { goBack: jest.fn() };
        const route: any = { key: "test-key", name: "Ajouter une adresse" };

        const { getByPlaceholderText, getByText } = render(
            <AddAddressScreen navigation={navigation} route={route} />
        );

        // Saisir le nom requis (canSubmit dépend de name.trim(), coords, user, isConfigured)
        fireEvent.changeText(getByPlaceholderText("ex: Café de la Paix"), "  Café Test  ");

        // Récupérer le Text puis presser le PARENT (le Pressable)
        const buttonTextNode = getByText(/Enregistrer/); // évite les soucis d’apostrophe typographique
        const pressableNode = buttonTextNode.parent; // ReactTestInstance | null
        expect(pressableNode).toBeTruthy();

        fireEvent.press(pressableNode as any);

        await waitFor(() => {
            expect(mockCreateAddress).toHaveBeenCalled();
        });

        const payload = mockCreateAddress.mock.calls[0][0];
        expect(payload).toMatchObject({
            userId: "user-1",
            name: "  Café Test  ", // le trim est fait côté service
            isPublic: true,
            latitude: 48.8566,
            longitude: 2.3522
        });
    });
});
