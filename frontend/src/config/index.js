/**
 * App configuration
 *
 * API_BASE_URL: Set via EXPO_PUBLIC_API_URL environment variable.
 *   - Local dev:   http://localhost:5085
 *   - Production:  <YARP gateway URL> (to be configured when gateway is ready)
 *
 * DEV_MODE: When true and no gateway is available, API calls include
 *   userId as a query parameter so the backend can identify the caller.
 *   Automatically enabled when running in Expo's __DEV__ mode.
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5085";

/** When true, sends userId as query param instead of relying on the gateway. */
export const DEV_MODE =
  process.env.EXPO_PUBLIC_DEV_MODE === "true" || __DEV__;

/** HTTP request timeout in milliseconds. */
export const API_TIMEOUT = 15_000;
