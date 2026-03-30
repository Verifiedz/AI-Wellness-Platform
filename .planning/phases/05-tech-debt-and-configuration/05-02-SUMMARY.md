---
phase: 05-tech-debt-and-configuration
plan: "02"
subsystem: notification-service, journal-service, auth-service, AI-Wrapper-Service, frontend
tags: [firebase, fail-fast, documentation, rate-limiting, wearable, coming-soon]
dependency_graph:
  requires: []
  provides: [CFG-03, DEBT-02, DEBT-03, DEBT-04]
  affects: [notification-service, journal-service, auth-service, AI-Wrapper-Service, frontend]
tech_stack:
  added: []
  patterns:
    - Firebase fail-fast validation pattern (check IsInitialized after Initialize())
    - XML doc remarks for known limitations and intentional duplication
key_files:
  created: []
  modified:
    - notification-service/src/NotificationService.Api/Program.cs
    - notification-service/src/NotificationService.Api/Infrastructure/StoredProcedureExecutor.cs
    - journal-service/src/JournalService.Api/Infrastructure/StoredProcedureExecutor.cs
    - auth-service/Middleware/RateLimitingMiddleware.cs
    - AI-Wrapper-Service/AIWrapperService/Middleware/RateLimitingMiddleware.cs
    - notification-service/src/NotificationService.Tests/Controllers/NotificationCodeControllerTests.cs
    - frontend/src/screens/SettingsScreen.js
    - frontend/src/screens/WearableSettingsScreen.js
decisions:
  - Firebase fail-fast check placed after Initialize() try/catch — preserves optional design while catching misconfigured paths
  - Test factories override Firebase:ServiceAccountPath to empty string — in-memory config overlays appsettings.json which sets a non-empty path
  - WearableSettingsScreen banner shown unconditionally (not only when !isAvailable) — avoids the case where isAvailable is false but banner is hidden
metrics:
  duration: 4m
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_modified: 8
---

# Phase 5 Plan 02: Firebase Fail-Fast, Docs, and Wearable Coming Soon Summary

Firebase fail-fast validation with clear error message when ServiceAccountPath is configured but invalid, XML doc comments for StoredProcedureExecutor intentional duplication (two services) and RateLimitingMiddleware scaling limitation (two services), and wearable Settings entry updated to "Coming soon" sublabel.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Firebase fail-fast + StoredProcedureExecutor + RateLimitingMiddleware docs | 05386d5 |
| 2 | Wearable feature marked as Coming Soon | 367aa7b |

## What Was Done

### Task 1: Firebase Fail-Fast Validation and Documentation Comments

**CFG-03 — Firebase fail-fast:**
Added a fail-fast check in `notification-service/src/NotificationService.Api/Program.cs` after the existing Firebase Initialize() try/catch block. If `Firebase:ServiceAccountPath` is configured (non-empty) but `firebaseService.IsInitialized` is false after initialization, the service throws `InvalidOperationException` with a clear error message explaining the problem and how to resolve it. If the path is unset or empty, the service starts normally using Expo Push.

**Test factory fix:**
Both `NotificationTestFactory` and `NotificationBypassTestFactory` in the test file now include `["Firebase:ServiceAccountPath"] = ""` in their `AddInMemoryCollection` dictionaries. This prevents the fail-fast check from throwing during tests, since `appsettings.json` sets a non-empty path that would otherwise be inherited by the test host via configuration overlay.

**DEBT-02 — StoredProcedureExecutor documentation:**
Added XML `<remarks>` doc comments with "INTENTIONAL DUPLICATION" marker to both:
- `notification-service/src/NotificationService.Api/Infrastructure/StoredProcedureExecutor.cs`
- `journal-service/src/JournalService.Api/Infrastructure/StoredProcedureExecutor.cs`

Both comments explain the duplication is intentional, note which service has the other copy, and direct future maintainers to the INFRA phase for shared library extraction.

**DEBT-04 — Rate limiting scaling documentation:**
Added XML `<remarks>` doc comments with "SCALING LIMITATION" marker to both:
- `auth-service/Middleware/RateLimitingMiddleware.cs` (uses IMemoryCache)
- `AI-Wrapper-Service/AIWrapperService/Middleware/RateLimitingMiddleware.cs` (uses ConcurrentDictionary)

Both comments explain that counters are in-process only and not shared across replicas, describe the multi-instance failure mode, and point to Redis as the solution for v2.

### Task 2: Wearable Feature — Coming Soon

**DEBT-03 — Wearable Coming Soon state:**
- `frontend/src/screens/SettingsScreen.js`: Changed Health Data sublabel from "Wearable device integration" to "Coming soon — requires native build" using the exact em dash from the plan spec.
- `frontend/src/screens/WearableSettingsScreen.js`: Updated warning banner to say "Coming Soon" prominently. Changed from a conditional render (only when `!isAvailable`) to unconditional — the screen always shows the Coming Soon banner. Updated JSDoc to reflect the screen is a skeleton for future implementation.

## Verification Results

```
notification-service build: PASS (0 errors)
journal-service build:      PASS (0 errors, 2 warnings - pre-existing HtmlSanitizer NU1902)
notification-service tests: PASS - 14/14 passed
grep "InvalidOperationException" Program.cs: 1 match
grep "IsInitialized" Program.cs: 1 match
grep "Firebase:ServiceAccountPath" test file: 2 matches
grep "INTENTIONAL DUPLICATION" notification StoredProcedureExecutor: 1 match
grep "INTENTIONAL DUPLICATION" journal StoredProcedureExecutor: 1 match
grep "SCALING LIMITATION" auth-service RateLimitingMiddleware: 1 match
grep "SCALING LIMITATION" AI-Wrapper RateLimitingMiddleware: 1 match
grep "Coming soon" SettingsScreen.js: 1 match
grep "Coming Soon" WearableSettingsScreen.js: 2 matches (JSDoc + banner message)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] WearableSettingsScreen banner shown unconditionally**
- **Found during:** Task 2
- **Issue:** The plan said "if there is already a warning banner, ensure it clearly says Coming Soon." The existing banner was conditional on `!isAvailable`. Since `isAvailable` is always false (wearable service stubs return false), the banner would always show anyway — but making it unconditional removes the dead conditional and makes the Coming Soon status clearer.
- **Fix:** Removed the `{!isAvailable && (...)}` conditional; banner is now always rendered.
- **Files modified:** `frontend/src/screens/WearableSettingsScreen.js`
- **Commit:** 367aa7b

## Known Stubs

None introduced by this plan. The wearable service (`wearableService.js`, `useWearableData.js`) contains pre-existing stubs returning false/null values — these are intentional skeleton files tracked under DEBT-03, not new stubs introduced here.

## Self-Check: PASSED
