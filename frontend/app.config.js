/**
 * Sakina — Expo app configuration.
 *
 * Environment variables:
 *   EXPO_PUBLIC_API_URL       – Base URL for the YARP gateway (default: http://localhost:5051)
 *   EXPO_PUBLIC_DEV_MODE      – "true" to enable dev-mode query params (must stay false in production)
 *   EXPO_PUBLIC_APP_LINK_HOST – Host serving /.well-known/apple-app-site-association
 *                               and /.well-known/assetlinks.json. Example: sakina.example.com.
 *                               Required for iOS Universal Links + Android App Links (Issue 13).
 *
 * Firebase:
 *   Place google-services.json (Android) and GoogleService-Info.plist (iOS) in the project root.
 */
const appLinkHost = process.env.EXPO_PUBLIC_APP_LINK_HOST || 'sakina.example.com';

export default {
  expo: {
    name: 'Sakina',
    slug: 'sakina',
    scheme: 'sakina',
    version: '1.0.0',
    runtimeVersion: { policy: 'appVersion' },
    updates: {
      url: 'https://u.expo.dev/79057051-8f94-4dd2-b705-d8c5d2d5c060',
      fallbackToCacheTimeout: 0,
    },
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FAF8F5',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.sakina.app',
      // Universal Links (Issue 13). Matching file served at
      // https://<host>/.well-known/apple-app-site-association.
      associatedDomains: [
        `applinks:${appLinkHost}`,
        `webcredentials:${appLinkHost}`,
      ],
      // iOS Privacy Manifest (Issue 15). Apple enforces this on every app
      // uploaded since May 2024. The manifest declares:
      //   - Tracking: we don't do any cross-app/site tracking. NSPrivacyTracking
      //     is false and NSPrivacyTrackingDomains is empty.
      //   - Collected data types: every category listed here must also match
      //     the App Privacy form in App Store Connect (see
      //     docs/APP_STORE_PRIVACY.md).
      //   - Required-reason APIs: these are the categories Apple forces every
      //     app to declare a reason for. The codes below are straight from
      //     https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api.
      //     Third-party SDKs (Expo, Sentry, Firebase) ship their own manifests
      //     alongside their binaries — we only need to cover first-party usage
      //     plus anything our JS bundle triggers directly.
      privacyManifests: {
        NSPrivacyTracking: false,
        NSPrivacyTrackingDomains: [],
        NSPrivacyCollectedDataTypes: [
          {
            // Account email used for auth + recovery.
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailAddress',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
          {
            // Display name shown in the UI + community posts.
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeName',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
          {
            // Internal user ID used to key rows across services.
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeUserID',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
          {
            // Journal entries + chat messages — user-typed content.
            NSPrivacyCollectedDataType:
              'NSPrivacyCollectedDataTypeOtherUserContent',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
          {
            // Mood + emotions logged in the journal.
            NSPrivacyCollectedDataType:
              'NSPrivacyCollectedDataTypeOtherHealthData',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
          {
            // Crash + performance traces via Sentry.
            NSPrivacyCollectedDataType:
              'NSPrivacyCollectedDataTypeCrashData',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
          {
            NSPrivacyCollectedDataType:
              'NSPrivacyCollectedDataTypePerformanceData',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
          {
            NSPrivacyCollectedDataType:
              'NSPrivacyCollectedDataTypeOtherDiagnosticData',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
        ],
        NSPrivacyAccessedAPITypes: [
          {
            // AsyncStorage / SecureStore fall back to NSUserDefaults internally.
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            // Expo + Sentry read file creation/modification timestamps when
            // writing logs and offline queues.
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1'],
          },
          {
            // Free-disk-space probes come from Expo's file system module and
            // the JS runtime when saving uploads.
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
            NSPrivacyAccessedAPITypeReasons: ['E174.1'],
          },
          {
            // React Native Date.now() + Sentry timestamps rely on boot time.
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategorySystemBootTime',
            NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
          },
        ],
      },
      // Uncomment when you have the Firebase plist:
      // googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FAF8F5',
      },
      softwareKeyboardLayoutMode: 'resize',
      edgeToEdgeEnabled: true,
      package: 'com.sakina.app',
      // App Links (Issue 13). autoVerify=true tells Android to fetch the
      // /.well-known/assetlinks.json at install time; only package + cert
      // fingerprints that match that file will capture https://<host>/*.
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: appLinkHost, pathPrefix: '/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      // Uncomment when you have the Firebase JSON:
      // googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-secure-store',
      'expo-localization',
      'expo-font',
      // Sentry 7.x config plugin. Required because @sentry/react-native ships
      // native iOS + Android modules that need to be linked into the EAS
      // build. Without this plugin, JS-side Sentry.init() works in Expo Go
      // but crashes/perf traces never reach the dashboard from a release
      // build.
      '@sentry/react-native/expo',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#5B7F6E',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow Sakina to access your photos for journal entries.',
          cameraPermission: 'Allow Sakina to take photos for journal entries.',
        },
      ],
      [
        'expo-speech-recognition',
        {
          microphonePermission: 'Allow Sakina to use the microphone for voice input.',
          speechRecognitionPermission: 'Allow Sakina to use speech recognition for voice input.',
          androidSpeechServicePackages: ['com.google.android.googlequicksearchbox'],
        },
      ],
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5051',
      eas: {
        projectId: '79057051-8f94-4dd2-b705-d8c5d2d5c060',
      },
    },
  },
};
