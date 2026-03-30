/**
 * App configuration
 *
 * API_BASE_URL: Set via EXPO_PUBLIC_API_URL environment variable.
 *   - Default points to the YARP gateway (Auth Service) on port 5051.
 *   - On a physical device, override with your machine's LAN IP in .env.
 *
 * DEV_MODE: When true and no gateway is available, API calls include
 *   userId as a query parameter so the backend can identify the caller.
 *   This should be explicitly enabled only for local integration testing.
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5051';

/** When true, sends userId as query param instead of relying on the gateway. */
export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// Guard: warn loudly if DEV_MODE is enabled in a production build.
// __DEV__ is a global injected by Metro bundler: true in dev, false in prod.
if (DEV_MODE && typeof __DEV__ !== 'undefined' && !__DEV__) {
  console.error(
    '[Sakina] SECURITY WARNING: EXPO_PUBLIC_DEV_MODE is enabled in a production build. ' +
    'This bypasses the authentication gateway. Set EXPO_PUBLIC_DEV_MODE to false.'
  );
}

/** HTTP request timeout in milliseconds. */
export const API_TIMEOUT = 15_000;
