---
phase: quick-260330-i4m
plan: 01
subsystem: auth-service, AI-Wrapper-Service
tags: [rate-limiting, security, tech-debt, middleware]
dependency_graph:
  requires: []
  provides: [TECH-DEBT-RATE-LIMITING]
  affects: [auth-service/Program.cs, AI-Wrapper-Service/AIWrapperService/Program.cs]
tech_stack:
  added: [Microsoft.AspNetCore.RateLimiting, System.Threading.RateLimiting]
  patterns: [PartitionedRateLimiter, FixedWindowRateLimiter, named-policy, RequireRateLimiting, EnableRateLimiting]
key_files:
  created: []
  modified:
    - auth-service/Program.cs
    - auth-service/Controllers/AuthController.cs
    - auth-service/AuthService.Tests/Middleware/RateLimitingOrderTests.cs
    - AI-Wrapper-Service/AIWrapperService/Program.cs
    - AI-Wrapper-Service/AIWrapperService/APIs/ChatApi.cs
    - AI-Wrapper-Service/AIWrapperService.Tests/Integration/RateLimitingTests.cs
  deleted:
    - auth-service/Middleware/RateLimitingMiddleware.cs
    - AI-Wrapper-Service/AIWrapperService/Middleware/RateLimitingMiddleware.cs
decisions:
  - "Used named policy with RequireRateLimiting on endpoint group instead of GlobalLimiter for AI-Wrapper-Service; GlobalLimiter was tested and did not apply in test environment"
  - "Read AiService:RateLimitPerMinute from IConfiguration per-request (not at startup) so WebApplicationFactory test config overrides take effect"
  - "Removed AddMemoryCache() from auth-service/Program.cs since IMemoryCache was only used by the deleted custom middleware"
  - "Applied [EnableRateLimiting(login)] on AuthController.Login so the stricter 5 req/min policy applies on top of the global 100 req/min policy"
metrics:
  duration: "~18 minutes"
  completed: "2026-03-30T17:16:56Z"
  tasks_completed: 3
  files_modified: 6
  files_deleted: 2
---

# Quick Task 260330-i4m: Replace Custom Rate Limiting with ASP.NET Core Built-in Summary

**One-liner:** Replaced hand-rolled IMemoryCache/ConcurrentDictionary rate limiters in both auth-service and AI-Wrapper-Service with ASP.NET Core's built-in AddRateLimiter/UseRateLimiter using FixedWindowRateLimiter policies.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Replace custom rate limiting in auth-service | 135b219 | Program.cs, AuthController.cs, RateLimitingOrderTests.cs |
| 2 | Replace custom rate limiting in AI-Wrapper-Service | 361f6cb | Program.cs, ChatApi.cs, RateLimitingTests.cs |
| 3 | Final build and full test verification | (no changes needed) | All tests verified green |

## What Was Built

### auth-service
- `AddRateLimiter` with `GlobalLimiter` (PartitionedRateLimiter, FixedWindow, 100 req/min per IP)
- Named "login" policy (FixedWindow, 5 req/min per IP) applied via `[EnableRateLimiting("login")]` on `AuthController.Login`
- `UseRateLimiter()` replaces `app.UseRateLimiting()` (removed extension method entirely)
- `AddMemoryCache()` removed — was only used by the deleted middleware
- `RateLimitingOrderTests` updated to search for `UseRateLimiter` instead of `UseRateLimiting`

### AI-Wrapper-Service
- `AddRateLimiter` with named "chat" policy (FixedWindow, configurable via `AiService:RateLimitPerMinute`, default 60/min per IP)
- `RequireRateLimiting("chat")` applied to the `/chat` endpoint group in `ChatApi.cs`
- `UseRateLimiter()` replaces `app.UseMiddleware<RateLimitingMiddleware>()`
- `OnRejected` returns ProblemDetails JSON with `Retry-After: 60` header — identical to previous behavior
- New integration test `ChatComplete_ExceedsRateLimit_Returns429` verifies 429 response after limit exceeded

## Test Results

- auth-service: 57/57 passed
- AI-Wrapper-Service: 47/47 passed (including 1 new test)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GlobalLimiter did not apply in WebApplicationFactory test environment**
- **Found during:** Task 2, when testing `ChatComplete_ExceedsRateLimit_Returns429`
- **Issue:** ASP.NET Core's `GlobalLimiter` requires endpoint metadata to apply in `TestServer` integration tests; requests without matched endpoints bypass it. Also, `rateLimitPerMinute` captured as a local variable at startup missed test config overrides from `WebApplicationFactory.ConfigureAppConfiguration` (which runs after Program.cs service registration).
- **Fix:** Switched from `GlobalLimiter` + path check to named policy "chat" with `RequireRateLimiting("chat")` on the `/chat` endpoint group in `ChatApi.cs`. Read `AiService:RateLimitPerMinute` from `IConfiguration` inside the partition factory (per-request) instead of capturing it as a local variable at startup.
- **Files modified:** `AI-Wrapper-Service/AIWrapperService/Program.cs`, `AI-Wrapper-Service/AIWrapperService/APIs/ChatApi.cs`
- **Commit:** 361f6cb

## Known Stubs

None — all rate limiting is fully wired and tested.

## Self-Check: PASSED
