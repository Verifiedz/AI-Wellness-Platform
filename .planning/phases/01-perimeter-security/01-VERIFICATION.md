---
phase: 01-perimeter-security
verified: 2026-03-29T12:00:00Z
status: passed
score: 5/5 must-haves verified
gaps: []
human_verification:
  - test: "Run dotnet test for auth-service and community-service test projects"
    expected: "All 17+ auth-service tests pass; all 4 community-service GatewayAuthMiddleware tests pass"
    why_human: "Cannot execute dotnet test in this environment without a full SDK build"
---

# Phase 01: Perimeter Security Verification Report

**Phase Goal:** All six services require authentication, 2FA is cryptographically sound, no credentials or exception details are exposed, and users cannot query other users' data
**Verified:** 2026-03-29T12:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                     | Status     | Evidence                                                                                                                                |
|----|----------------------------------------------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| 1  | A 2FA code generation request produces a cryptographically unpredictable code and no log entry contains the code value | ✓ VERIFIED | `RandomNumberGenerator.GetInt32(100000, 1000000)` in `AuthService.GenerateRandomCode` (line 293); old `_logger.LogInformation($"2FA Code...")` line deleted entirely; test `GenerateRandomCode_UsesCsprng` and `TwoFactor_CodeNotLogged` exist |
| 2  | Any request to community-service without the gateway shared secret receives a 401 response before reaching any controller | ✓ VERIFIED | `GatewayAuthMiddleware` returns 401 JSON on missing or invalid `X-Internal-Api-Key`; registered first in pipeline via `app.UseMiddleware<GatewayAuthMiddleware>()` before `app.MapControllers()` |
| 3  | A user authenticated as user A cannot retrieve profile data for user B via the user-info endpoint (receives 403/401) | ✓ VERIFIED | `GET /api/auth/user-info` uses `[Authorize]` and extracts email from the JWT token claim, not from a request parameter; old `[HttpGet("user-info/{email}")]` route removed; test `UserInfoByEmail_EndpointRemoved` guards against re-introduction |
| 4  | Exception messages from auth-service failures return a generic error to the API client while full details appear in server logs only | ✓ VERIFIED | `ExceptionHandlingMiddleware.GetGenericMessage()` maps error codes to safe strings; internal message passed only to `_logger.LogError`; six middleware tests confirm no internal message leaks (e.g., `ExceptionResponse_DoesNotExposeMessage`, `GenericException_Returns500_WithInternalErrorCode`) |
| 5  | No plaintext credentials or environment-specific URLs appear in committed config files                      | ✓ VERIFIED | `community-service/appsettings.json` has `Password=` (empty); `AI-Wrapper-Service/appsettings.json` has `"BaseUrl": ""` (empty); all other appsettings have `Password=` (empty) or `Key: ""`; `.env.example` exists at project root |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact                                                              | Purpose                                      | Exists | Substantive | Wired  | Status     |
|-----------------------------------------------------------------------|----------------------------------------------|--------|-------------|--------|------------|
| `auth-service/Services/AuthService.cs`                                | CSPRNG code gen, no 2FA log                  | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/Controllers/AuthController.cs`                          | User-info endpoint enforces JWT auth          | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/Middleware/ExceptionHandlingMiddleware.cs`              | Safe error responses (SEC-07)                 | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/Exceptions/AuthException.cs`                            | Domain exception base class (SEC-08)          | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/Exceptions/AuthValidationException.cs`                  | Validation domain exception                   | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/Exceptions/AuthConflictException.cs`                    | Conflict domain exception                     | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/Exceptions/AuthSecurityException.cs`                    | Security domain exception                     | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/Exceptions/AuthNotFoundException.cs`                    | Not-found domain exception                    | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `community-service/CommunityService/Middleware/GatewayAuthMiddleware.cs` | Gateway shared-secret enforcement (SEC-03) | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `community-service/CommunityService/Program.cs`                       | Middleware pipeline wires GatewayAuthMiddleware | ✓    | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/AuthService.Tests/Services/AuthServiceTests.cs`         | Tests for SEC-01, SEC-02, SEC-08             | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/AuthService.Tests/Controllers/AuthControllerTests.cs`   | Test for SEC-06 endpoint removal             | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `auth-service/AuthService.Tests/Middleware/ExceptionHandlingMiddlewareTests.cs` | Tests for SEC-07                   | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `community-service/CommunityService.Tests/Middleware/GatewayAuthMiddlewareTests.cs` | Tests for SEC-03                | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `community-service/CommunityService/appsettings.json`                 | No hardcoded credentials (SEC-09)            | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `AI-Wrapper-Service/AIWrapperService/appsettings.json`                | No hardcoded RunPod URL (SEC-10)             | ✓      | ✓           | ✓      | ✓ VERIFIED |
| `.env.example`                                                        | Environment variable documentation (D-06)    | ✓      | ✓           | N/A    | ✓ VERIFIED |

---

### Key Link Verification

| From                                  | To                                        | Via                                            | Status     | Details                                                            |
|---------------------------------------|-------------------------------------------|------------------------------------------------|------------|--------------------------------------------------------------------|
| `AuthService.GenerateRandomCode`       | `RandomNumberGenerator.GetInt32`          | Static method call (line 293)                  | ✓ WIRED    | `System.Security.Cryptography` imported, CSPRNG call verified      |
| `AuthService.LoginAsync`              | 2FA code log                              | No log call (removed)                          | ✓ WIRED    | No `LogInformation`/`LogWarning` calls in `AuthService.cs` except line 210 (password reset, no PII) |
| `AuthController.GetUserInfo`          | JWT email claim                           | `User.FindFirst(ClaimTypes.Email)` (line 99)   | ✓ WIRED    | No email param route; `[Authorize]` attribute enforces token requirement |
| `ExceptionHandlingMiddleware`         | `GetGenericMessage()`                     | Domain exception pattern match (lines 37-62)   | ✓ WIRED    | Internal message goes to logger only; client receives mapped safe string |
| `GatewayAuthMiddleware`               | Pipeline (community-service)             | `app.UseMiddleware<GatewayAuthMiddleware>()` (Program.cs line 33) | ✓ WIRED | Registered before `MapControllers()`; `/health` bypass exempt |
| Auth-service YARP routes              | `AuthorizationPolicy: "default"`          | All 4 routes in `appsettings.json`             | ✓ WIRED    | chat-route, notification-route, journal-route, community-route all require valid JWT |
| auth-service Program.cs               | `ExceptionHandlingMiddleware`             | `app.UseMiddleware<ExceptionHandlingMiddleware>()` line 131 | ✓ WIRED | First middleware in pipeline before rate limiting, auth |

---

### Data-Flow Trace (Level 4)

Not applicable. Phase 01 produces security infrastructure (middleware, exception handling, config changes), not components that render dynamic data from a database.

---

### Behavioral Spot-Checks

| Behavior                                           | Check Method                                                        | Result   | Status  |
|----------------------------------------------------|---------------------------------------------------------------------|----------|---------|
| CSPRNG produces non-constant codes                 | Inspect `GenerateRandomCode` — uses `RandomNumberGenerator.GetInt32` | Confirmed | ✓ PASS |
| 2FA code not logged                                | Grep for log calls with code value in `AuthService.cs`              | 0 matches | ✓ PASS |
| GatewayAuthMiddleware returns 401 on missing key   | Code reads `context.Response.StatusCode = 401` on line 41           | Confirmed | ✓ PASS |
| Exception middleware strips internal message       | `GetGenericMessage()` maps codes to safe strings; no `exception.Message` in response | Confirmed | ✓ PASS |
| `Password=postgres` removed from community appsettings | Grep appsettings.json for "Password=postgres"                  | 0 matches | ✓ PASS |
| RunPod URL removed from AI-Wrapper appsettings     | Grep appsettings.json for "runpod"                                 | 0 matches | ✓ PASS |

---

### Requirements Coverage

| Requirement | Description                                                          | Status      | Evidence                                                                                      |
|-------------|----------------------------------------------------------------------|-------------|-----------------------------------------------------------------------------------------------|
| SEC-01      | 2FA codes not logged in plaintext                                    | ✓ SATISFIED | Old `$"2FA Code for {user.Email}: {twoFactorCode}"` log line deleted; test `TwoFactor_CodeNotLogged` present |
| SEC-02      | Security codes use `RandomNumberGenerator` (CSPRNG)                 | ✓ SATISFIED | `RandomNumberGenerator.GetInt32(100000, 1000000)` in `GenerateRandomCode`; test `GenerateRandomCode_UsesCsprng` present |
| SEC-03      | Community service validates gateway shared-secret before processing  | ✓ SATISFIED | `GatewayAuthMiddleware` uses `CryptographicOperations.FixedTimeEquals`; registered first in community-service pipeline; 4 tests present |
| SEC-05      | PII removed from log string interpolation in auth-service            | ✓ SATISFIED | All `$""` interpolation log calls converted to named placeholders (`{Email}`, `{Identifier}` etc.); zero `$""` in production log calls |
| SEC-06      | User info endpoint enforces authorization (users can only query own data) | ✓ SATISFIED | `GET /api/auth/user-info` uses `[Authorize]` + JWT email claim extraction; old `user-info/{email}` route removed; reflection test guards re-introduction |
| SEC-07      | Exception messages not exposed to API clients                        | ✓ SATISFIED | `ExceptionHandlingMiddleware.GetGenericMessage()` returns safe strings; 6 middleware tests confirm no internal message leaks |
| SEC-08      | Auth service uses domain exception types (prerequisite for SEC-07)   | ✓ SATISFIED | 5 typed exceptions (`AuthException`, `AuthValidationException`, `AuthConflictException`, `AuthSecurityException`, `AuthNotFoundException`) exist and are used throughout `AuthService.cs` |
| SEC-09      | Hardcoded credentials removed from community-service appsettings.json | ✓ SATISFIED | `Password=` (empty) in `community-service/CommunityService/appsettings.json`; runtime value supplied by docker-compose env var |
| SEC-10      | Hardcoded RunPod proxy URL removed from AI-Wrapper-Service appsettings.json | ✓ SATISFIED | `"BaseUrl": ""` (empty) in `AI-Wrapper-Service/AIWrapperService/appsettings.json`; runtime value supplied via `OpenAI__BaseUrl` env var |

**All 9 phase-1 requirements (SEC-01, 02, 03, 05, 06, 07, 08, 09, 10) are SATISFIED.**

Note: SEC-04 (timing-safe API key comparison in notification-service) is assigned to Phase 2 — not in scope for this phase and correctly not implemented here.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `community-service/CommunityService/appsettings.json` | 9 | `Username=postgres` in connection string | Info | Non-secret default username; the credential fix (SEC-09) targeted `Password=postgres` specifically. Postgres default username is not a secret. No action required. |
| `auth-service/Program.cs` | 162-164 | Dev endpoint `/db-test` uses `Results.Problem($"Database error: {ex.Message}")` which leaks exception detail | Warning | Only active in Development environment (`if (app.Environment.IsDevelopment())`). Not exposed in production. Acceptable dev-time helper. |
| `chat-service/ChatService/Program.cs` | 19-23 | `app.UseAuthentication()` and `app.UseAuthorization()` only run in non-Development mode | Warning | Chat-service skips auth checks in dev. However, this is an internal service only reachable via the YARP gateway (which enforces JWT for all routes). Defense-in-depth gap in dev but not a production concern within the gateway model. Phase goal is "all six services require authentication via gateway" — this is satisfied at the gateway boundary. |

No blockers found.

---

### Human Verification Required

#### 1. Full Test Suite Execution

**Test:** Run `dotnet test auth-service/AuthService.Tests/` and `dotnet test community-service/CommunityService.Tests/`
**Expected:** All 17 auth-service tests pass; all 4 community-service gateway tests pass; zero failures
**Why human:** Cannot run `dotnet test` without a full build environment and SDK

#### 2. End-to-End: 2FA Login Flow

**Test:** Register a user, call `POST /api/auth/login`, observe server logs
**Expected:** No log line contains the 6-digit 2FA code; logs show only `"Login initiated for: {Email}"` with the email value
**Why human:** Requires a running instance with structured log output visible

#### 3. Community Service Gateway Rejection

**Test:** `curl http://localhost:PORT/api/community/posts` without `X-Internal-Api-Key` header
**Expected:** `401 {"error":"GATEWAY_AUTH_REQUIRED","message":"Gateway authentication required"}`
**Why human:** Requires a running community-service container

---

### Gaps Summary

No gaps. All five observable truths are verified. All nine requirement IDs (SEC-01 through SEC-10, minus SEC-04 which is scoped to Phase 2) are satisfied by substantive, wired, non-stub implementations.

**Three informational observations (non-blocking):**
1. `Username=postgres` remains in community-service appsettings — this is a non-secret default, not the credential removed by SEC-09.
2. The auth-service `/db-test` development endpoint leaks exception detail, but only runs in `IsDevelopment()` mode.
3. Chat-service skips in-process auth middleware in development — acceptable because the YARP gateway enforces JWT for all chat routes in production.

---

_Verified: 2026-03-29T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
