/**
 * Expo app configuration.
 *
 * Environment variables:
 *   EXPO_PUBLIC_API_URL  – Base URL for the backend API (default: http://localhost:5085)
 *   EXPO_PUBLIC_DEV_MODE – "true" to enable dev-mode query params (auto-enabled in __DEV__)
 *
 * Firebase:
 *   Place google-services.json (Android) and GoogleService-Info.plist (iOS) in the project root.
 */
export default {
  expo: {
    name: "Wellness App",
    slug: "wellness-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#4A90D9",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.wellness.app",
      // Uncomment when you have the Firebase plist:
      // googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#4A90D9",
      },
      edgeToEdgeEnabled: true,
      package: "com.wellness.app",
      // Uncomment when you have the Firebase JSON:
      // googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-secure-store",
      "expo-localization",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#4A90D9",
        },
      ],
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5085",
      eas: {
        projectId: "79057051-8f94-4dd2-b705-d8c5d2d5c060",
      },
    },
  },
};
