# Sakina — Load Tests

`loadtest.js` — k6 script that exercises `GET /api/auth/health`, `POST /api/auth/login`, and `GET /api/auth/user-info` (JWT-protected) against the gateway. Ramps to 100 VUs over ~3.5 minutes and fails the run if P95 thresholds are exceeded.

## Quick start

```bash
# 1. Install k6
#    Windows: choco install k6    (or scoop install k6)
#    macOS:   brew install k6
#    Linux:   https://grafana.com/docs/k6/latest/set-up/install-k6/

# 2. Start the stack
docker compose up -d

# 3. Seed a test user (once)
curl -X POST http://localhost:5051/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"loadtest@sakina.local","password":"LoadTest123!","firstName":"Load","lastName":"Test"}'

# 4. Run
k6 run loadtest/loadtest.js
```

## Running against Azure (production demo)

```bash
k6 run \
  -e BASE_URL=https://api.sakina.app \
  -e TEST_EMAIL=loadtest@sakina.app \
  -e TEST_PASSWORD=<password> \
  loadtest/loadtest.js
```

## Thresholds (hard fails)

| Metric | Budget |
|---|---|
| `http_req_duration` p95 | < 800 ms |
| `http_req_duration` p99 | < 1500 ms |
| `http_req_failed` rate | < 2 % |
| `sakina_login_latency_ms` p95 | < 900 ms |
| `sakina_protected_latency_ms` p95 | < 500 ms |

If any threshold is breached, k6 exits non-zero — useful for CI.

## Poster screenshot

The test ends with a compact custom summary you can screenshot:

```
=== Sakina load test summary ===
  Total requests                     12,430
  Failed request rate                0.04 %
  P95 all requests                   312.4 ms
  P95 login                          614.8 ms
  P95 user-info                      188.3 ms
  Login errors (custom)              0
  Protected errors (custom)          0
```

A raw `results.json` is also written alongside for later graphing in Grafana or k6 Cloud.

## Notes

- Login runs every iteration on purpose — this stress-tests the JWT signing + BCrypt + DB read path, not just a cached token.
- If 2FA/email verification is enforced for `loadtest@sakina.local`, the login calls will 403. Register through the app (which skips 2FA by default) or provision the user directly in the database with `email_verified = true`.
- Pointing the test at RunPod chat (`POST /chat/**`) is tempting but would consume real GPU tokens and cost money. Stick to auth-service endpoints unless you specifically want to load-test the model.
