# Sakina – React Native (Expo) Frontend

A mental wellness app for students built with **Expo SDK 54** targeting **iOS and Android**.
Provides AI-powered chat therapy, journaling with pattern analysis, community support, breathing exercises, and mood tracking.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Configuration](#configuration)
4. [Project Structure](#project-structure)
5. [Authentication](#authentication)
6. [Notification Feature](#notification-feature)
7. [API Contract](#api-contract)
8. [Testing Without the Gateway](#testing-without-the-gateway)
9. [Firebase Setup](#firebase-setup)

---

## Prerequisites

| Tool                              | Version                           |
| --------------------------------- | --------------------------------- |
| Node.js                           | 18+                               |
| npm / yarn                        | latest                            |
| Expo CLI                          | `npx expo` (bundled with the SDK) |
| Expo Go **or** a dev client build | for on-device testing             |
| Physical device                   | required for push notifications   |

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

The app reads `EXPO_PUBLIC_API_URL` from the environment. If unset it defaults to `http://localhost:5051` (the auth-service gateway port).

| Environment | Value                                           |
| ----------- | ----------------------------------------------- |
| Local dev   | `http://<your-local-ip>:5051`                   |
| Production  | `https://<your-domain>` (nginx TLS termination) |

**Setting the variable:**

```bash
# Option A – inline
EXPO_PUBLIC_API_URL=http://192.168.1.42:5051 npx expo start

# Option B – .env file (Expo SDK 54+ reads these automatically)
# Create a .env file in the frontend/ directory:
EXPO_PUBLIC_API_URL=http://192.168.1.42:5051
EXPO_PUBLIC_DEV_MODE=true
```

### Dev Mode

When `EXPO_PUBLIC_DEV_MODE=true` (or when running via `npx expo start` which sets `__DEV__` to `true`), the API client appends `?userId=<id>` as a query parameter on every request. This lets you test against the Notification Service backend **without** the YARP gateway or real JWT validation.

---

## Project Structure

```
frontend/
├── App.js                          # Root component (providers + notification setup)
├── app.config.js                   # Expo config (bundle ID: com.sakina.app)
├── src/
│   ├── config/
│   │   └── index.js                # API_BASE_URL, DEV_MODE, API_TIMEOUT (15s)
│   ├── constants/
│   │   ├── journal.js              # Shared MOODS, EMOTIONS, MOOD_COLORS
│   │   ├── breathingPatterns.js    # Breathing exercise patterns
│   │   └── assessments.js         # PHQ-9 / GAD-7 question definitions
│   ├── context/
│   │   ├── AuthContext.js          # JWT auth (SecureStore-backed, real login flow)
│   │   ├── ThemeContext.js         # Colors, dark mode, accent color
│   │   ├── OnboardingContext.js    # Tracks first-run onboarding flow
│   │   └── TipContext.js           # Global daily-tip state
│   ├── navigation/
│   │   ├── AppNavigator.js         # Root: auth check → AuthStack | MainTabs
│   │   ├── AuthStack.js            # Login, Register, ForgotPassword
│   │   ├── MainTabs.js             # Bottom tabs: Home, Journal, AI Chat, Community, Settings
│   │   └── SettingsStack.js        # Settings → NotificationSettings
│   ├── screens/
│   │   ├── LoginScreen.js          # Email + password login with error mapping
│   │   ├── RegisterScreen.js       # User registration
│   │   ├── HomeScreen.js           # Home with "Tip of the Day" section
│   │   ├── JournalScreen.js        # Journal entry with mood/emotion selection
│   │   ├── MoodCalendarScreen.js   # Monthly mood history calendar
│   │   ├── AIChatScreen.js         # AI chat with session management
│   │   ├── BreathingExerciseScreen.js  # Guided breathing exercises
│   │   ├── CommunityScreen.js      # Community groups and posts
│   │   ├── SettingsScreen.js       # Settings menu
│   │   └── NotificationSettingsScreen.js  # Push notification preferences
│   ├── services/
│   │   ├── api.js                  # ApiClient: auth headers, 401 refresh, 15s timeout
│   │   ├── authApi.js              # Auth endpoints (login, register, refresh)
│   │   ├── chatApi.js              # Chat endpoints (sessions, messages)
│   │   ├── journalApi.js           # Journal CRUD + insights
│   │   ├── notificationApi.js      # Notification preferences + device registration
│   │   └── pushNotifications.js    # Expo push-notification setup + listeners
│   ├── theme/
│   │   └── colors.js               # Color palette
│   └── utils/
│       └── time.js                 # Timezone & time conversion helpers
└── assets/                         # App icons, splash screen
```

---

## Authentication

The `AuthContext` manages real JWT authentication backed by the auth-service.

- Login calls `POST /api/auth/login` with email and password.
- The JWT is stored in **SecureStore** (encrypted device storage).
- All API calls send `Authorization: Bearer <token>`.
- On 401 responses, the API client automatically attempts a token refresh via `POST /api/auth/refresh`, then retries the original request.
- If refresh fails, the session is cleared and the user is redirected to login.

In **dev mode** (`EXPO_PUBLIC_DEV_MODE=true`), `?userId=<id>` is appended to requests as a fallback for testing internal services without the gateway.

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

| Method | Path               | Body                                        | Response                                   |
| ------ | ------------------ | ------------------------------------------- | ------------------------------------------ |
| `GET`  | `/preferences`     | —                                           | `200`: preferences object; `404`: none yet |
| `POST` | `/preferences`     | `{ isEnabled, preferredTimeUtc, timezone }` | `200`: updated preferences                 |
| `POST` | `/register-device` | `{ deviceToken }`                           | `200`: updated preferences with token      |

**Error shape:** `{ error, message, timestamp?, details? }`

---

## Testing Without the Gateway

When running services directly without Docker Compose:

1. Run the individual service locally (auth-service on `:5051`, etc.).
2. Set `EXPO_PUBLIC_API_URL` to `http://<your-local-ip>:5051`.
3. Set `EXPO_PUBLIC_DEV_MODE=true` — the API client appends `?userId=<id>` on every request, enabling `DevelopmentUserContextMiddleware` on each internal service.

For production / staging:

- Set `EXPO_PUBLIC_API_URL` to the HTTPS gateway URL (nginx TLS endpoint).
- Set `EXPO_PUBLIC_DEV_MODE=false`.

---

## Firebase Setup

The app uses **expo-notifications** which integrates with FCM (Android) and APNs (iOS).

1. Create (or reuse) a Firebase project that matches the Notification Service backend.
2. **Android**: Download `google-services.json` and place it in the project root. Uncomment the `googleServicesFile` line in `app.config.js` under `android`.
3. **iOS**: Download `GoogleService-Info.plist` and place it in the project root. Uncomment the `googleServicesFile` line in `app.config.js` under `ios`.
4. Build a dev client (`npx expo run:android` / `npx expo run:ios`) or use EAS Build for push-notification testing on a physical device.

---

## Scripts

<!-- AUTO-GENERATED from frontend/package.json scripts -->

| Command                    | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `npx expo start`           | Start the Expo dev server (QR code)              |
| `npx expo start --android` | Start and open on Android emulator               |
| `npx expo start --ios`     | Start and open on iOS simulator                  |
| `npx expo run:android`     | Build and run Android dev client (push support)  |
| `npx expo run:ios`         | Build and run iOS dev client (push support)      |
| `npm test`                 | Run Jest unit tests                              |
| `npm run lint`             | Lint with ESLint                                 |
| `npm run format`           | Format with Prettier                             |

<!-- END AUTO-GENERATED -->
