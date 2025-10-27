// Déclare "process.env" pour Expo sans importer @types/node (qui peut perturber RN).
declare const process: {
    env: Record<string, string | undefined>;
};

export { };
