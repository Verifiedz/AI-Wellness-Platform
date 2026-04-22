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
const rawDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
// Never allow DEV_MODE in a production build, even if leaked into env.
// __DEV__ is a global injected by Metro bundler: true in dev, false in prod.
export const DEV_MODE = rawDevMode && (typeof __DEV__ === 'undefined' || __DEV__);
if (rawDevMode && !DEV_MODE) {
  console.error(
    '[Sakina] EXPO_PUBLIC_DEV_MODE=true leaked into a production build; forcing to false.'
  );
}

/** HTTP request timeout in milliseconds. */
export const API_TIMEOUT = 15_000;

/**
 * Public URLs for the hosted Privacy Policy and Terms of Service.
 *
 * Apple App Store Connect and Google Play Console both require a publicly
 * reachable Privacy Policy URL before an app can be submitted for review, and
 * Apple additionally requires that the in-app account deletion flow (Guideline
 * 5.1.1(v)) link to the policy.
 *
 * These default to the production domain served by nginx under `/privacy` and
 * `/terms`, and can be overridden per-build via EXPO_PUBLIC_LEGAL_BASE_URL.
 */
const LEGAL_BASE_URL =
  process.env.EXPO_PUBLIC_LEGAL_BASE_URL ||
  'https://sakina.app';

export const PRIVACY_POLICY_URL = `${LEGAL_BASE_URL}/privacy`;
export const TERMS_OF_SERVICE_URL = `${LEGAL_BASE_URL}/terms`;
export const SUPPORT_EMAIL = 'support@sakina.app';
