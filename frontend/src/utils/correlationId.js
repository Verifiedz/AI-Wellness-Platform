/**
 * Correlation ID helpers for distributed tracing.
 *
 * A correlation id is a per-request opaque token that lets us stitch together
 * logs from the mobile app, the YARP gateway, and every downstream microservice
 * in our observability stack (Sentry + Serilog JSON). We generate one per
 * outgoing HTTP request rather than per app session so that mapping a single
 * user journey to a specific error is unambiguous.
 *
 * We avoid pulling in `uuid` at runtime because the React Native polyfill
 * situation is fragile; the RFC 4122 v4 layout generated here is sufficient
 * for tracing (not a security-critical identifier).
 */
export function generateCorrelationId() {
  // Prefer native crypto.randomUUID when available (RN 0.73+, web, modern Hermes).
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  // Fallback: RFC 4122 v4 using Math.random(). Not cryptographically strong,
  // but this value is only used as a log key.
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4';
    } else if (i === 19) {
      out += hex[(Math.random() * 4) | (0 + 8)];
    } else {
      out += hex[(Math.random() * 16) | 0];
    }
  }
  return out;
}
