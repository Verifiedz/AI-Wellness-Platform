---
phase: 02-internal-communication-security
plan: 01
subsystem: auth
tags: [security, cryptography, middleware, cors, rate-limiting, timing-attack]

# Dependency graph
requires:
  - phase: 01-perimeter-security
    provides: community-service GatewayAuthMiddleware using CryptographicOperations.FixedTimeEquals (reference implementation)
provides:
  - Timing-safe API key validation in notification-service using CryptographicOperations.FixedTimeEquals
  - Correct ASP.NET Core middleware pipeline order in auth-service (CORS before rate limiting)
  - Regression tests verifying middleware order cannot be silently broken
affects: [03-test-coverage, integration-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CryptographicOperations.FixedTimeEquals for all API key comparisons (not string equality)"
    - "ASP.NET Core pipeline order: ExceptionHandling -> CORS -> Authentication -> Authorization -> RateLimiting"

key-files:
  created:
    - auth-service/AuthService.Tests/Middleware/RateLimitingOrderTests.cs
  modified:
    - notification-service/src/NotificationService.Api/Controller/NotificationCodeController.cs
    - auth-service/Program.cs

key-decisions:
  - "Per-request config read in NotificationCodeController.ValidateApiKey is acceptable (controllers are transient) — no constructor field needed, diff stays minimal"
  - "Middleware order test reads Program.cs source file as static analysis — integration testing CORS+rate-limiting with running server is Phase 3 scope"

patterns-established:
  - "All internal API key comparisons must use CryptographicOperations.FixedTimeEquals, not string equality"
  - "ASP.NET Core pipeline: CORS always before rate limiting so OPTIONS preflights are not rate-limited"

requirements-completed: [SEC-04, REL-01]

# Metrics
duration: 10min
completed: 2026-03-30
---

# Phase 02 Plan 01: Internal Communication Security — Timing-Safe API Key and Middleware Order Summary

**CryptographicOperations.FixedTimeEquals replaces string equality in notification-service ValidateApiKey, and auth-service middleware reordered so CORS preflights bypass rate limiting**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-30T05:41:14Z
- **Completed:** 2026-03-30T05:51:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Eliminated timing oracle vulnerability: notification-service API key comparison now uses constant-time byte comparison via `CryptographicOperations.FixedTimeEquals`
- Fixed middleware ordering bug: `UseCors` now runs before `UseRateLimiting` in auth-service, preventing CORS preflight OPTIONS requests from being rate-limited and returning 429
- Added two regression tests in `RateLimitingOrderTests.cs` that read `Program.cs` source to assert `UseCors` and `UseAuthentication` both appear before `UseRateLimiting`

## Task Commits

Each task was committed atomically:

1. **Task 1: Timing-safe API key comparison in NotificationCodeController (SEC-04)** - `0e0fa69` (fix)
2. **Task 2: Reorder auth-service middleware pipeline + order tests (REL-01)** - `657c93d` (fix)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `notification-service/src/NotificationService.Api/Controller/NotificationCodeController.cs` - ValidateApiKey replaced with FixedTimeEquals implementation; added `using System.Security.Cryptography` and `using System.Text`
- `auth-service/Program.cs` - Middleware pipeline reordered: CORS -> Authentication -> Authorization -> RateLimiting
- `auth-service/AuthService.Tests/Middleware/RateLimitingOrderTests.cs` - New test class with `MiddlewareOrder_CorsRegisteredBeforeRateLimiting` and `MiddlewareOrder_AuthenticationRegisteredBeforeRateLimiting`

## Decisions Made

- Per-request config read in `ValidateApiKey` is acceptable because ASP.NET Core controllers are transient — no constructor field needed, keeping the diff minimal
- Middleware order test uses source-code static analysis (reads `Program.cs` as a string) rather than a running server — integration testing CORS + rate limiting together is deferred to Phase 3

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

MSBuild cache file read error (`MSB3492`) occurred when running `dotnet build -q`. Identified as a Windows file lock timing issue unrelated to code changes. Builds succeed without `-q` flag. Both services build with 0 warnings and 0 errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both SEC-04 and REL-01 requirements are resolved
- `notification-service` and `auth-service` both build clean with zero warnings
- Two regression tests protect the middleware order from silent regressions
- Phase 3 (test coverage) can now expand on auth-service test project structure established here

---
*Phase: 02-internal-communication-security*
*Completed: 2026-03-30*
