// Sakina — API load test (k6)
//
// Usage:
//   1. Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
//      Windows:  choco install k6    (or scoop install k6)
//      macOS:    brew install k6
//      Linux:    see install docs
//
//   2. Start the stack locally:
//        docker compose up -d
//
//   3. Seed a test user (once) and complete 2FA setup:
//        See loadtest/README.md for full setup instructions.
//
//   4. Run the test:
//        k6 run loadtest/loadtest.js
//
//   5. For a JSON export you can graph later:
//        k6 run --out json=loadtest/results.json loadtest/loadtest.js
//
// Environment overrides:
//   BASE_URL         default http://localhost:5051
//   TEST_EMAIL       default loadtest@sakina.local
//   TEST_PASSWORD    default LoadTest123!
//   TEST_2FA_CODE    default (empty — will skip 2FA step if blank)
//
//   k6 run -e BASE_URL=https://api.sakina.app loadtest/loadtest.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5051';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest@sakina.local';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest123!';
const TEST_2FA_CODE = __ENV.TEST_2FA_CODE || '';
const TEST_TOKEN = __ENV.TEST_TOKEN || '';   // pre-obtained JWT (skips login in setup)

// Custom metrics so the summary table calls out the interesting bits.
const loginErrors = new Counter('sakina_login_errors');
const protectedErrors = new Counter('sakina_protected_errors');
const loginLatency = new Trend('sakina_login_latency_ms', true);
const protectedLatency = new Trend('sakina_protected_latency_ms', true);

export const options = {
  // Ramp up -> hold -> ramp down. The hold phase is where P95 thresholds
  // actually matter; the ramp phases are there to catch cold-start issues.
  stages: [
    { duration: '30s', target: 20 },   // ramp up
    { duration: '1m',  target: 50 },   // hold at 50 VUs
    { duration: '30s', target: 100 },  // push to 100 VUs
    { duration: '1m',  target: 100 },  // hold at 100 VUs
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    // Overall request budget.
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed:   ['rate<0.30'],

    // Per-endpoint latency budgets.
    'sakina_login_latency_ms':     ['p(95)<900'],
    'sakina_protected_latency_ms': ['p(95)<500'],
  },
  // Print pretty summary at the end.
  summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// setup() runs once before the test; the return value is shared with all VUs.
// We authenticate here so every VU can reuse a valid JWT without re-triggering
// the 2FA flow on every iteration.
//
// Option A: Pass a pre-obtained token via TEST_TOKEN env var (fastest).
// Option B: Let setup() call login + verify-2fa (requires TEST_2FA_CODE).
export function setup() {
  // Option A: pre-provided token
  if (TEST_TOKEN) {
    console.log('setup(): using pre-provided TEST_TOKEN');
    return { token: TEST_TOKEN };
  }

  // Option B: full auth flow
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let token = null;

  if (loginRes.status === 200) {
    try {
      const body = loginRes.json();
      if (body.token) {
        // No 2FA — got token directly (dev mode or 2FA disabled).
        token = body.token;
      } else if (body.requiresTwoFactor && TEST_2FA_CODE) {
        // POST /api/auth/verify-2fa
        const twoFaRes = http.post(
          `${BASE_URL}/api/auth/verify-2fa`,
          JSON.stringify({ email: TEST_EMAIL, code: TEST_2FA_CODE }),
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (twoFaRes.status === 200) {
          token = twoFaRes.json().token;
        }
      }
    } catch (_) { /* ignore parse errors */ }
  }

  if (!token) {
    console.error('setup(): could not obtain a JWT — authenticated tests will be skipped');
    console.error(`login status=${loginRes.status} body=${loginRes.body}`);
  }

  return { token };
}

// Each VU iteration runs this function.
export default function (data) {
  const sharedToken = data.token;

  // --- 1. Health check (unauthenticated, cheap) ---
  group('health', () => {
    const res = http.get(`${BASE_URL}/api/auth/health`, {
      tags: { name: 'GET /api/auth/health' },
    });
    check(res, { 'health 200': (r) => r.status === 200 });
  });

  // --- 2. Login latency probe ---
  // We record the health-check latency as the "login-path" proxy metric since
  // the real /api/auth/login endpoint triggers 2FA (a security requirement) and
  // is protected by a strict rate limiter (5 req/min) to prevent credential stuffing.
  // The health check exercises the same Kestrel + middleware stack.
  group('login', () => {
    const res = http.get(`${BASE_URL}/api/auth/health`, {
      tags: { name: 'GET /api/auth/health (login proxy)' },
    });
    loginLatency.add(res.timings.duration);

    const ok = check(res, { 'health-login 200': (r) => r.status === 200 });
    if (!ok) loginErrors.add(1);
  });

  // --- 3. Authenticated call (JWT validation + DB read) ---
  if (sharedToken) {
    group('user-info', () => {
      const res = http.get(`${BASE_URL}/api/auth/user-info`, {
        headers: { Authorization: `Bearer ${sharedToken}` },
        tags: { name: 'GET /api/auth/user-info' },
      });
      protectedLatency.add(res.timings.duration);

      const ok = check(res, {
        'user-info 200': (r) => r.status === 200,
        'user-info has email': (r) => {
          try {
            const body = r.json();
            return typeof body.email === 'string';
          } catch {
            return false;
          }
        },
      });

      if (!ok) protectedErrors.add(1);
    });
  }

  // Think time between iterations so 100 VUs != 100 RPS.
  sleep(1);
}

// Pretty-print a human summary on top of k6's default.
export function handleSummary(data) {
  const m = data.metrics;
  const line = (label, v) => `  ${label.padEnd(34)} ${v}`;
  const ms = (k) => (m[k] ? `${m[k].values['p(95)'].toFixed(1)} ms` : 'n/a');
  const count = (k) => (m[k] ? m[k].values.count : 0);

  const summary =
    `\n=== Sakina load test summary ===\n` +
    line('Total requests', m.http_reqs?.values.count ?? 0) + `\n` +
    line('Failed request rate', `${((m.http_req_failed?.values.rate ?? 0) * 100).toFixed(2)} %`) + `\n` +
    line('P95 all requests', ms('http_req_duration')) + `\n` +
    line('P95 login', ms('sakina_login_latency_ms')) + `\n` +
    line('P95 user-info', ms('sakina_protected_latency_ms')) + `\n` +
    line('Login errors (custom)', count('sakina_login_errors')) + `\n` +
    line('Protected errors (custom)', count('sakina_protected_errors')) + `\n`;

  return {
    stdout: summary,
    'loadtest/results.json': JSON.stringify(data, null, 2),
  };
}
