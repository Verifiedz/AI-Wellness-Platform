/**
 * Wearable data service abstraction.
 *
 * Phase 1: Stub implementation. All methods return null/false gracefully.
 *
 * To enable real wearable data:
 * 1. Install: npx expo install react-native-health react-native-health-connect
 * 2. Create a custom dev build: npx expo prebuild && npx expo run:ios
 * 3. Replace this stub with the native implementation.
 *
 * The stub pattern avoids Metro bundler errors when the native packages
 * are not installed (Expo Go, web, or standard builds without native modules).
 */

/**
 * Check if wearable integration is available on this platform.
 * Returns false until native packages are installed and a dev build is used.
 */
export function isWearableAvailable() {
  return false;
}

/**
 * Request permissions for health data access.
 * @returns {Promise<boolean>}
 */
export async function requestPermissions() {
  return false;
}

/**
 * Get today's step count.
 * @returns {Promise<number|null>}
 */
export async function getSteps() {
  return null;
}

/**
 * Get today's average heart rate.
 * @returns {Promise<number|null>}
 */
export async function getHeartRate() {
  return null;
}

/**
 * Get last night's total sleep hours.
 * @returns {Promise<number|null>}
 */
export async function getSleepHours() {
  return null;
}
