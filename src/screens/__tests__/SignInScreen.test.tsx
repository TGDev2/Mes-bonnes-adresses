import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SignInScreen from "../SignInScreen";

// Mutable mock object to control return of useAuth()
const mockAuth: any = {
    isConfigured: true,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
};

jest.mock("@/context/AuthContext", () => ({
    useAuth: () => mockAuth
}));

describe("SignInScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuth.isConfigured = true;
    });

    it("appelle signIn avec email et mot de passe", async () => {
        const navigation: any = { navigate: jest.fn() };
        const route: any = { key: "test-key", name: "Se connecter" };

        const { getByPlaceholderText, getByText } = render(
            <SignInScreen navigation={navigation} route={route} />
        );

        fireEvent.changeText(getByPlaceholderText("Email"), "john@example.com");
        fireEvent.changeText(getByPlaceholderText("Mot de passe"), "Secret123!");
        fireEvent.press(getByText("Se connecter"));

        await waitFor(() =>
            expect(mockAuth.signIn).toHaveBeenCalledWith(
                "john@example.com",
                "Secret123!"
            )
        );
    });

    it("affiche la bannière lorsque Firebase n'est pas configuré", () => {
        mockAuth.isConfigured = false;
        const navigation: any = { navigate: jest.fn() };
        const route: any = { key: "test-key", name: "Se connecter" };

        const { getByText } = render(<SignInScreen navigation={navigation} route={route} />);

        expect(
            getByText(/Firebase n’est pas encore configuré/i)
        ).toBeTruthy();
    });
});
