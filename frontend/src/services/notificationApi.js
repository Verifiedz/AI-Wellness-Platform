import { apiClient } from "./api";

const BASE_PATH = "/api/notifications";

function toCamelString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizePreferences(raw) {
  if (!raw || typeof raw !== "object") return null;

  const userId = raw.userId ?? raw.UserId;
  if (!userId) return null;

  return {
    userId: String(userId),
    isEnabled: Boolean(raw.isEnabled ?? raw.IsEnabled),
    preferredTimeUtc: toCamelString(
      raw.preferredTimeUtc ?? raw.PreferredTimeUtc,
      "09:00:00"
    ),
    timezone: toCamelString(raw.timezone ?? raw.Timezone, "UTC"),
    deviceToken: toCamelString(raw.deviceToken ?? raw.DeviceToken, ""),
    createdAt: raw.createdAt ?? raw.CreatedAt ?? null,
    updatedAt: raw.updatedAt ?? raw.UpdatedAt ?? null,
  };
}

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
    return apiClient.get(`${BASE_PATH}/preferences`).then((result) => {
      if (result.error || !result.data) return result;
      const normalized = normalizePreferences(result.data);
      if (!normalized) {
        return {
          status: result.status,
          data: null,
          error: "Invalid preferences payload from server",
        };
      }

      return {
        ...result,
        data: normalized,
      };
    });
  },

  /**
   * Create or update notification preferences.
   * @param {{ isEnabled: boolean, preferredTimeUtc: string, timezone: string }} prefs
   *   preferredTimeUtc in "HH:mm:ss" format
   * @returns {{ status, data, error }}
   */
  savePreferences(prefs) {
    return apiClient
      .post(`${BASE_PATH}/preferences`, {
      isEnabled: prefs.isEnabled,
      preferredTimeUtc: prefs.preferredTimeUtc,
      timezone: prefs.timezone,
      })
      .then((result) => {
        if (result.error || !result.data) return result;
        const normalized = normalizePreferences(result.data);
        if (!normalized) {
          return {
            status: result.status,
            data: null,
            error: "Invalid preferences payload from server",
          };
        }

        return {
          ...result,
          data: normalized,
        };
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
