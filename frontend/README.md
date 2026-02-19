# Wellness App – React Native (Expo) Frontend

A full wellness app for students, built with **Expo SDK 54** targeting **iOS and Android**.  
This first slice implements the **app shell** (navigation, placeholder auth, placeholder screens) and the **notification feature** (push setup, preferences, daily-tip display).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Configuration](#configuration)
4. [Project Structure](#project-structure)
5. [Authentication (Placeholder)](#authentication-placeholder)
6. [Notification Feature](#notification-feature)
7. [API Contract](#api-contract)
8. [Testing Without the Gateway](#testing-without-the-gateway)
9. [Firebase Setup](#firebase-setup)
10. [Swapping to Real Auth](#swapping-to-real-auth)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm / yarn | latest |
| Expo CLI | `npx expo` (bundled with the SDK) |
| Expo Go **or** a dev client build | for on-device testing |
| Physical device | required for push notifications |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the Expo dev server
npx expo start

# 3. Scan the QR code with Expo Go (Android/iOS)
#    or press 'a' for Android emulator / 'i' for iOS simulator
```

> **Note:** Push notifications will only work on a **physical device**, not on emulators/simulators.

---

## Configuration

### API Base URL

The app reads `EXPO_PUBLIC_API_URL` from the environment. If unset it defaults to `http://localhost:5085`.

| Environment | Value |
|-------------|-------|
| Local dev | `http://<your-local-ip>:5085` |
| Production | `https://<yarp-gateway-url>` (set when the gateway is deployed) |

**Setting the variable:**

```bash
# Option A – inline
EXPO_PUBLIC_API_URL=http://192.168.1.42:5085 npx expo start

# Option B – .env file (Expo SDK 54+ reads these automatically)
# Create a .env file in the project root:
EXPO_PUBLIC_API_URL=http://192.168.1.42:5085
EXPO_PUBLIC_DEV_MODE=true
```

### Dev Mode

When `EXPO_PUBLIC_DEV_MODE=true` (or when running via `npx expo start` which sets `__DEV__` to `true`), the API client appends `?userId=<id>` as a query parameter on every request. This lets you test against the Notification Service backend **without** the YARP gateway or real JWT validation.

---

## Project Structure

```
frontend/
├── App.js                          # Root component (providers + notification setup)
├── app.config.js                   # Expo config (replaces app.json)
├── src/
│   ├── config/
│   │   └── index.js                # API_BASE_URL, DEV_MODE, API_TIMEOUT
│   ├── context/
│   │   ├── AuthContext.js           # Placeholder auth (SecureStore-backed)
│   │   └── TipContext.js            # Global daily-tip state
│   ├── navigation/
│   │   ├── AppNavigator.js          # Root: auth check → AuthStack | MainTabs
│   │   ├── AuthStack.js             # Login screen
│   │   ├── MainTabs.js              # Bottom tabs: Home, Journal, AI Chat, Settings
│   │   └── SettingsStack.js         # Settings → NotificationSettings
│   ├── screens/
│   │   ├── LoginScreen.js           # Dev login (User ID + optional email)
│   │   ├── HomeScreen.js            # Home with "Tip of the Day" section
│   │   ├── JournalScreen.js         # Placeholder
│   │   ├── AIChatScreen.js          # Placeholder
│   │   ├── SettingsScreen.js        # Settings menu
│   │   └── NotificationSettingsScreen.js  # Load/save notification preferences
│   ├── services/
│   │   ├── api.js                   # Generic HTTP client (auth headers, timeout)
│   │   ├── notificationApi.js       # Notification REST endpoints
│   │   └── pushNotifications.js     # Expo push-notification setup + listeners
│   ├── theme/
│   │   └── colors.js                # Colour palette
│   └── utils/
│       └── time.js                  # Timezone & time conversion helpers
└── assets/                          # App icons, splash screen
```

---

## Authentication (Placeholder)

The `AuthContext` provides a **dev-only login** that accepts a User ID (and optional email), generates a mock JWT, and stores it in **SecureStore**.

- All API calls send `Authorization: Bearer <token>` (the mock token for now).
- In dev mode, `?userId=<id>` is also appended as a fallback.

**To log in during development**, enter any string as the User ID on the login screen (e.g. `user-1`).

---

## Notification Feature

### Flow

1. **After login**, the app automatically:
   - Requests notification permissions from the OS.
   - Obtains the native device push token (FCM on Android, APNs on iOS).
   - Calls `POST /api/notifications/register-device` with `{ deviceToken }`.

2. **Notification Settings screen** (Settings → Notification Settings):
   - Loads existing preferences via `GET /api/notifications/preferences`.
   - If 404, shows "not configured" state with defaults.
   - User can toggle daily tips on/off and pick a preferred local time.
   - The selected time is converted to UTC (`HH:mm:ss`) using the device's IANA timezone.
   - Saves via `POST /api/notifications/preferences`.

3. **Receiving a daily tip**:
   - The backend sends an FCM push with **title** "Your Daily Wellness Tip", **body** = tip text, and **data** = `{ tipId, category }`.
   - **Foreground**: notification banner shown; tip displayed on Home automatically.
   - **Background/killed → tap**: app opens, navigates to Home, and displays the tip in the "Tip of the Day" card.

---

## API Contract

Base path: `${EXPO_PUBLIC_API_URL}/api/notifications`

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/preferences` | — | `200`: preferences object; `404`: none yet |
| `POST` | `/preferences` | `{ isEnabled, preferredTimeUtc, timezone }` | `200`: updated preferences |
| `POST` | `/register-device` | `{ deviceToken }` | `200`: updated preferences with token |

**Error shape:** `{ error, message, timestamp?, details? }`

---

## Testing Without the Gateway

When the YARP API gateway is not yet deployed:

1. Run the Notification Service locally (e.g. on port 5085).
2. Set `EXPO_PUBLIC_API_URL` to `http://<your-local-ip>:5085`.
3. Ensure `EXPO_PUBLIC_DEV_MODE=true` (auto-enabled in dev builds).
4. The API client will append `?userId=<id>` on every request, bypassing JWT validation.
5. Configure the Notification Service to run in "dev mode" and accept the `userId` query parameter.

When the gateway is ready:
- Set `EXPO_PUBLIC_API_URL` to the gateway URL.
- Set `EXPO_PUBLIC_DEV_MODE=false` (or remove it).
- Replace the placeholder login with the real Auth Service call (see below).

---

## Firebase Setup

The app uses **expo-notifications** which integrates with FCM (Android) and APNs (iOS).

1. Create (or reuse) a Firebase project that matches the Notification Service backend.
2. **Android**: Download `google-services.json` and place it in the project root. Uncomment the `googleServicesFile` line in `app.config.js` under `android`.
3. **iOS**: Download `GoogleService-Info.plist` and place it in the project root. Uncomment the `googleServicesFile` line in `app.config.js` under `ios`.
4. Build a dev client (`npx expo run:android` / `npx expo run:ios`) or use EAS Build for push-notification testing on a physical device.

---

## Swapping to Real Auth

When the Authentication Service is ready, only **two changes** are needed:

1. **`src/context/AuthContext.js`** – Replace the `login` method body:

   ```js
   // Before (placeholder):
   const mockToken = `dev-jwt-${userId}-${Date.now()}`;

   // After (real):
   const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ email, password }),
   });
   const { token, userId } = await response.json();
   ```

2. **`src/screens/LoginScreen.js`** – Replace the User ID field with email/password fields and call `login(userId, email)` with the real credentials.

Everything else (token storage, `Authorization` header, navigation, notification flows) stays the same.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npx expo start` | Start the dev server |
| `npx expo start --android` | Start and open on Android |
| `npx expo start --ios` | Start and open on iOS |
| `npx expo run:android` | Build and run Android dev client |
| `npx expo run:ios` | Build and run iOS dev client |
