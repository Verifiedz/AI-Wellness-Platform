---
phase: 01-perimeter-security
plan: "03"
subsystem: api
tags: [middleware, security, gateway, shared-secret, community-service, yarp]

# Dependency graph
requires:
  - phase: 01-perimeter-security
    provides: community-service test project scaffold (01-00-SUMMARY.md)
provides:
  - GatewayAuthMiddleware with timing-safe FixedTimeEquals comparison on X-Internal-Api-Key
  - Community-service rejects all non-health requests without valid gateway shared secret (SEC-03 fixed)
  - YARP transform in auth-service injects X-Internal-Api-Key for community-service proxied requests
  - docker-compose.yml configures COMMUNITY_INTERNAL_API_KEY for both auth-service and community-service
  - 4 unit tests proving SEC-03 rejection and pass-through behavior
affects: [community-service, auth-service, docker-compose]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GatewayAuthMiddleware pattern: timing-safe FixedTimeEquals, /health bypass, InvalidOperationException at startup if secret not configured"
    - "YARP inject-on-proxy: inject X-Internal-Api-Key inside AddTransforms block using IConfiguration from DI"

key-files:
  created:
    - community-service/CommunityService/Middleware/GatewayAuthMiddleware.cs
    - community-service/CommunityService.Tests/Middleware/GatewayAuthMiddlewareTests.cs
  modified:
    - community-service/CommunityService/Program.cs
    - auth-service/Program.cs
    - docker-compose.yml

key-decisions:
  - "Inject X-Internal-Api-Key on all YARP proxied requests (not just community-cluster) -- other services ignore the header; this is simpler and avoids RouteModel metadata lookup"
  - "GatewayAuthMiddleware skips /health internally (not via middleware ordering) to keep Docker health checks working"

patterns-established:
  - "GatewayAuthMiddleware: read secret in constructor, throw InvalidOperationException if missing, use FixedTimeEquals per request"

requirements-completed: [SEC-03]

# Metrics
duration: 10min
completed: "2026-03-30"
---

# Phase 01 Plan 03: Community-Service Gateway Auth Summary

**GatewayAuthMiddleware added to community-service enforcing X-Internal-Api-Key with timing-safe comparison; YARP gateway injects the header for all proxied requests to community-service**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-30T03:48:00Z
- **Completed:** 2026-03-30T03:53:11Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Created `GatewayAuthMiddleware.cs` using `CryptographicOperations.FixedTimeEquals` for timing-safe comparison of the `X-Internal-Api-Key` header against `Gateway:SharedSecret` configuration
- Registered middleware in community-service `Program.cs` after CORS and before `MapControllers`; `/health` path bypasses auth internally
- Extended auth-service YARP `AddTransforms` block to inject `CommunityService:ApiKey` as `X-Internal-Api-Key` on all proxied requests
- Added `COMMUNITY_INTERNAL_API_KEY` env var configuration to both `community-service` and `auth-service` blocks in `docker-compose.yml`
- Replaced stub `GatewayAuthMiddlewareTests.cs` with 4 passing xUnit tests proving SEC-03 is fixed

## Task Commits

1. **Task 1: Create GatewayAuthMiddleware and register in community-service pipeline** - `157cfce` (feat)
2. **Task 2: Add YARP transform for community-service API key injection and update docker-compose.yml** - `cdc3174` (feat)
3. **Task 3: Write tests for GatewayAuthMiddleware (SEC-03)** - `62ccf21` (test)

## Files Created/Modified

- `community-service/CommunityService/Middleware/GatewayAuthMiddleware.cs` - New middleware; validates X-Internal-Api-Key using FixedTimeEquals; skips /health; returns 401 JSON on missing/invalid key
- `community-service/CommunityService/Program.cs` - Added `using CommunityService.Middleware;` and `app.UseMiddleware<GatewayAuthMiddleware>();` between UseCors and MapControllers
- `auth-service/Program.cs` - Extended YARP AddTransforms to inject `X-Internal-Api-Key` from `CommunityService:ApiKey` config on all proxied requests
- `docker-compose.yml` - Added `Gateway__SharedSecret` and `Gateway__RequireSharedSecret` to community-service env; added `CommunityService__ApiKey` to auth-service env; both reference `COMMUNITY_INTERNAL_API_KEY`
- `community-service/CommunityService.Tests/Middleware/GatewayAuthMiddlewareTests.cs` - 4 xUnit tests: missing key, invalid key, valid key pass-through, /health bypass

## Decisions Made

- **Inject X-Internal-Api-Key on all YARP proxied requests (not just community-cluster):** Avoids RouteModel metadata lookup complexity. Other downstream services (chat, journal, notification) don't validate this header and will ignore it. Simpler and functionally equivalent.
- **Skip /health internally in middleware (not via ordering):** The middleware itself checks `context.Request.Path.StartsWithSegments("/health")` and calls `_next` directly. This is more robust than relying on middleware ordering with `app.MapGet("/health", ...)`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `using Xunit;` to test file**
- **Found during:** Task 3 (writing tests)
- **Issue:** `ImplicitUsings` does not include xunit namespaces; `[Fact]` attribute was unresolved (CS0246)
- **Fix:** Added `using Xunit;` import to test file
- **Files modified:** `community-service/CommunityService.Tests/Middleware/GatewayAuthMiddlewareTests.cs`
- **Verification:** All 4 tests compiled and passed after fix
- **Committed in:** `62ccf21` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: missing using directive)
**Impact on plan:** Trivial one-line fix, no scope change.

## Issues Encountered

- `dotnet test -x` flag not valid on Windows -- ran without it. Tests passed normally.

## User Setup Required

The `COMMUNITY_INTERNAL_API_KEY` environment variable must be added to your `.env` file before running docker-compose. Generate a secure random value (e.g., `openssl rand -base64 32`) and add:

```
COMMUNITY_INTERNAL_API_KEY=<your-generated-secret>
```

No dashboard configuration required.

## Next Phase Readiness

- SEC-03 is fully resolved: community-service rejects unauthenticated requests with 401, and the YARP gateway correctly injects the shared secret for all proxied requests
- The `GatewayAuthMiddleware` pattern can be reused for any other internal service that needs gateway-only access enforcement
- All 4 unit tests pass; builds succeed for both community-service and auth-service

---
*Phase: 01-perimeter-security*
*Completed: 2026-03-30*
