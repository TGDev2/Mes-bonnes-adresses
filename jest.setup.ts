import "@testing-library/jest-native/extend-expect";
import "react-native-gesture-handler/jestSetup";

/**
 * ❗️Ne pas référencer des chemins internes `react-native/Libraries/*`
 * qui varient selon les versions de RN.
 * On supprime donc les mocks de NativeAnimatedHelper/Alert.
 */

// Mocks stables pour Expo et RN

jest.mock("expo-image-picker", () => ({
    launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
    requestMediaLibraryPermissionsAsync: jest
        .fn()
        .mockResolvedValue({ status: "granted" }),
    MediaTypeOptions: { Images: "Images" },
    PermissionStatus: { GRANTED: "granted", DENIED: "denied" }
}));

// Mock react-native-maps: composants neutres sans JSX (fichier .ts)
jest.mock("react-native-maps", () => {
    const Mock = (_props: any) => null;
    return {
        __esModule: true,
        default: Mock, // MapView
        Marker: Mock,
        Callout: Mock
    };
});
