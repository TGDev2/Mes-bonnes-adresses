// Déclaration minimale pour satisfaire TypeScript lors de l'import de `firebase/auth/react-native`.
// Le runtime Expo/Metro résout correctement ce module ; on évite juste l'erreur TS.
declare module "firebase/auth/react-native" {
  export const getReactNativePersistence: (storage: any) => any;
  export const initializeAuth: (app: any, options: any) => any;
}
