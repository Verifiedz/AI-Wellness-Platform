import { apiClient } from "./api";

const BASE_PATH = "/api/notifications";

/**
 * Notification REST API service.
 *
 * Endpoint contract:
 *   GET  /api/notifications/preferences         → 200 | 404
 *   POST /api/notifications/preferences         → 200
 *   POST /api/notifications/register-device     → 200
 */
export const notificationApi = {
  /**
   * Fetch the current user's notification preferences.
   * @returns {{ status, data, error }}
   *   data: { userId, isEnabled, preferredTimeUtc, timezone, deviceToken?, createdAt, updatedAt }
   *   404 → preferences not set yet
   */
  getPreferences() {
    return apiClient.get(`${BASE_PATH}/preferences`);
  },

  /**
   * Create or update notification preferences.
   * @param {{ isEnabled: boolean, preferredTimeUtc: string, timezone: string }} prefs
   *   preferredTimeUtc in "HH:mm:ss" format
   * @returns {{ status, data, error }}
   */
  savePreferences(prefs) {
    return apiClient.post(`${BASE_PATH}/preferences`, {
      isEnabled: prefs.isEnabled,
      preferredTimeUtc: prefs.preferredTimeUtc,
      timezone: prefs.timezone,
    });
  },

  /**
   * Register the device's push token with the backend.
   * @param {string} deviceToken – FCM (Android) or APNs (iOS) token
   * @returns {{ status, data, error }}
   */
  registerDevice(deviceToken) {
    return apiClient.post(`${BASE_PATH}/register-device`, { deviceToken });
  },
};
