import React from "react";
import { render } from "@testing-library/react-native";

const mockAuth: any = {
    isConfigured: false, // évite toute souscription Firestore
    user: null,
    loading: false
};

jest.mock("@/context/AuthContext", () => ({
    useAuth: () => mockAuth
}));

jest.mock("@/hooks/useUserLocation", () => ({
    useUserLocation: () => ({
        coords: null,
        permissionGranted: false,
        loading: false,
        error: null
    })
}));

jest.mock("@/services/addressService", () => ({
    subscribePublicAddresses: jest.fn(() => () => { }),
    subscribeUserAddresses: jest.fn(() => () => { }),
    deleteAddress: jest.fn().mockResolvedValue(undefined)
}));

jest.mock("@react-navigation/native", () => {
    const actual = jest.requireActual("@react-navigation/native");
    return {
        ...actual,
        useNavigation: () => ({ navigate: jest.fn() })
    };
});

import MapScreen from "../MapScreen";

describe("MapScreen", () => {
    it("affiche le message si la permission de localisation est refusée", () => {
        const { getByText } = render(<MapScreen />);
        expect(
            getByText(/La permission de localisation est nécessaire/i)
        ).toBeTruthy();
    });
});
