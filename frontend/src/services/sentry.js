/**
 * Sentry initialization for the Sakina mobile app.
 *
 * Reads the DSN from the Expo public env (`EXPO_PUBLIC_SENTRY_DSN`) so we can
 * configure it differently per build profile via EAS. If the DSN is missing
 * (e.g. during local dev), we no-op instead of crashing — this makes the
 * initializer safe to call unconditionally from App.js.
 */
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn =
    process.env.EXPO_PUBLIC_SENTRY_DSN ||
    Constants.expoConfig?.extra?.sentryDsn ||
    null;
  if (!dsn) return;

  try {
    Sentry.init({
      dsn,
      environment: process.env.EXPO_PUBLIC_ENV || Constants.expoConfig?.extra?.env || 'production',
      release: Constants.expoConfig?.version || '1.0.0',
      // Do NOT send default PII: we explicitly attach a user id on login instead.
      sendDefaultPii: false,
      // Keep sample rates conservative at launch; can be tuned in dashboard.
      tracesSampleRate: 0.1,
      enableAutoSessionTracking: true,
    });
    initialized = true;
  } catch {
    // Never let observability break the app.
  }
}

/** Called after a successful login so crash reports can be grouped per-user. */
export function setSentryUser(userId) {
  if (!initialized) return;
  try {
    Sentry.setUser(userId ? { id: userId } : null);
  } catch {
    // ignore
  }
}

/** Called on logout/delete to clear the Sentry user scope. */
export function clearSentryUser() {
  if (!initialized) return;
  try {
    Sentry.setUser(null);
  } catch {
    // ignore
  }
}
