/** @type {import('jest').Config} */
module.exports = {
    preset: "jest-expo",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    transformIgnorePatterns: [
        "node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-.*|@react-native-.*)"
    ],
    testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"]
};
