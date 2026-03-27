import { Platform } from "react-native";

/**
 * Wearable data service abstraction.
 *
 * Phase 1: On-device only. Uses HealthKit (iOS) / Health Connect (Android).
 * When the native modules are not available (web, Expo Go), all methods
 * gracefully return fallback values so the app never crashes.
 *
 * The native libraries (react-native-health, react-native-health-connect)
 * are optional peer dependencies. They must be installed separately and
 * require a custom Expo dev build — they do not work in Expo Go.
 */

let HealthKit = null;
let HealthConnect = null;

// Attempt to load native modules — they may not be installed
try {
  if (Platform.OS === "ios") {
    HealthKit = require("react-native-health")?.default;
  }
} catch {
  // HealthKit not available
}

try {
  if (Platform.OS === "android") {
    HealthConnect = require("react-native-health-connect");
  }
} catch {
  // Health Connect not available
}

/**
 * Check if wearable integration is available on this platform.
 */
export function isWearableAvailable() {
  if (Platform.OS === "ios") return HealthKit != null;
  if (Platform.OS === "android") return HealthConnect != null;
  return false;
}

/**
 * Request permissions for health data access.
 * @returns {Promise<boolean>} whether permissions were granted
 */
export async function requestPermissions() {
  if (!isWearableAvailable()) return false;

  try {
    if (Platform.OS === "ios" && HealthKit) {
      const permissions = {
        permissions: {
          read: [
            HealthKit.Constants.Permissions.StepCount,
            HealthKit.Constants.Permissions.HeartRate,
            HealthKit.Constants.Permissions.SleepAnalysis,
          ],
        },
      };
      await new Promise((resolve, reject) => {
        HealthKit.initHealthKit(permissions, (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
      return true;
    }

    if (Platform.OS === "android" && HealthConnect) {
      const result = await HealthConnect.requestPermission([
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "HeartRate" },
        { accessType: "read", recordType: "SleepSession" },
      ]);
      return result?.length > 0;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Get today's step count.
 * @returns {Promise<number|null>}
 */
export async function getSteps() {
  if (!isWearableAvailable()) return null;

  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (Platform.OS === "ios" && HealthKit) {
      return new Promise((resolve) => {
        HealthKit.getStepCount(
          { date: startOfDay.toISOString() },
          (err, results) => {
            if (err) resolve(null);
            else resolve(Math.round(results?.value || 0));
          }
        );
      });
    }

    if (Platform.OS === "android" && HealthConnect) {
      const result = await HealthConnect.readRecords("Steps", {
        timeRangeFilter: {
          operator: "between",
          startTime: startOfDay.toISOString(),
          endTime: today.toISOString(),
        },
      });
      const total = (result?.records || []).reduce((sum, r) => sum + (r.count || 0), 0);
      return total;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Get today's average heart rate.
 * @returns {Promise<number|null>}
 */
export async function getHeartRate() {
  if (!isWearableAvailable()) return null;

  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (Platform.OS === "ios" && HealthKit) {
      return new Promise((resolve) => {
        HealthKit.getHeartRateSamples(
          {
            startDate: startOfDay.toISOString(),
            endDate: today.toISOString(),
          },
          (err, results) => {
            if (err || !results?.length) resolve(null);
            else {
              const avg = results.reduce((sum, r) => sum + r.value, 0) / results.length;
              resolve(Math.round(avg));
            }
          }
        );
      });
    }

    if (Platform.OS === "android" && HealthConnect) {
      const result = await HealthConnect.readRecords("HeartRate", {
        timeRangeFilter: {
          operator: "between",
          startTime: startOfDay.toISOString(),
          endTime: today.toISOString(),
        },
      });
      const samples = (result?.records || []).flatMap((r) => r.samples || []);
      if (samples.length === 0) return null;
      const avg = samples.reduce((sum, s) => sum + (s.beatsPerMinute || 0), 0) / samples.length;
      return Math.round(avg);
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Get last night's total sleep hours.
 * @returns {Promise<number|null>}
 */
export async function getSleepHours() {
  if (!isWearableAvailable()) return null;

  try {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    if (Platform.OS === "ios" && HealthKit) {
      return new Promise((resolve) => {
        HealthKit.getSleepSamples(
          {
            startDate: yesterday.toISOString(),
            endDate: today.toISOString(),
          },
          (err, results) => {
            if (err || !results?.length) resolve(null);
            else {
              const totalMs = results.reduce((sum, r) => {
                const start = new Date(r.startDate).getTime();
                const end = new Date(r.endDate).getTime();
                return sum + (end - start);
              }, 0);
              resolve(Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10);
            }
          }
        );
      });
    }

    if (Platform.OS === "android" && HealthConnect) {
      const result = await HealthConnect.readRecords("SleepSession", {
        timeRangeFilter: {
          operator: "between",
          startTime: yesterday.toISOString(),
          endTime: today.toISOString(),
        },
      });
      const totalMs = (result?.records || []).reduce((sum, r) => {
        const start = new Date(r.startTime).getTime();
        const end = new Date(r.endTime).getTime();
        return sum + (end - start);
      }, 0);
      return totalMs > 0 ? Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10 : null;
    }
  } catch {
    return null;
  }

  return null;
}
