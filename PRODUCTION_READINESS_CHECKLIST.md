# Production Readiness Checklist (Frontend + Auth + Notification)

## Required Runtime Environment Variables

| Variable | Service | Purpose |
| --- | --- | --- |
| `JWT_KEY` | auth-service | JWT signing key |
| `NOTIFICATION_INTERNAL_API_KEY` | auth-service, notification-service | Internal key for `/api/notifications/send-code` |
| `AUTH_DB_PASSWORD` | auth-db, auth-service | Auth database password |
| `NOTIFICATION_DB_PASSWORD` | notification-db, notification-service | Notification database password |
| `Cors__AllowedOrigins__0` | auth-service, notification-service | Allowed production origin #1 |
| `Cors__AllowedOrigins__1` | auth-service, notification-service | Allowed production origin #2 (optional) |

## Validation Commands

Run from `AI-Wellness-Platform` root:

```bash
dotnet build auth-service
dotnet build notification-service/src/NotificationService.Api
docker compose config
```

Expected:
- both .NET projects build successfully
- `docker compose config` resolves services and shows environment-backed secrets
- no hardcoded production keys remain in committed appsettings

## API Flow Validation (Pre-release)

1. **Auth login**
   - `POST /api/auth/login` returns either `Token` or `RequiresTwoFactor=true`
2. **2FA (when required)**
   - `POST /api/auth/verify-2fa` returns `Token`
3. **Notification preferences through gateway**
   - `GET /api/notifications/preferences` (via gateway) returns 200/404
   - `POST /api/notifications/preferences` returns 200
4. **Device registration through gateway**
   - `POST /api/notifications/register-device` returns 200
5. **Internal send-code hardening**
   - `POST /api/notifications/send-code` without `X-Internal-Api-Key` returns 401
   - same request with valid key returns 200

## Mobile Release Checklist

- `EXPO_PUBLIC_API_URL` points to gateway host
- `EXPO_PUBLIC_DEV_MODE=false`
- login uses real email/password flow
- logout clears secure store token/user fields
- app recovers session only if `/api/auth/user-info` succeeds

## Observability Baseline

## Logging
- Use structured logs with request route, status code, and user context where applicable
- Log auth failures and 429 rate-limit events with source IP
- Log notification send-code attempts and API key failures

## Health Monitoring
- Probe auth health endpoint: `/api/auth/health`
- Probe notification health endpoint: `/api/health`
- Alert on:
  - sustained 5xx rate
  - database connectivity failures
  - repeated unauthorized send-code attempts

## Rollback Controls
- Keep `Gateway__RequireSharedSecret` configurable at runtime
- If emergency rollback is needed, disable shared-secret enforcement temporarily while rotating keys
- Keep previous image tag available for quick service rollback
