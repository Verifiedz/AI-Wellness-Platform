---
phase: 02-internal-communication-security
plan: 02
subsystem: notification-service, journal-service, auth-service-tests
tags: [security, sql-injection, validation, stored-procedures]
dependency_graph:
  requires: []
  provides: [sql-identifier-validation-notification, sql-identifier-validation-journal]
  affects: [notification-service, journal-service, auth-service-tests]
tech_stack:
  added: []
  patterns: [sql-identifier-guard, regex-validation, defense-in-depth]
key_files:
  created:
    - auth-service/AuthService.Tests/Services/StoredProcedureValidationTests.cs
  modified:
    - notification-service/src/NotificationService.Api/Infrastructure/StoredProcedureExecutor.cs
    - journal-service/src/JournalService.Api/Infrastructure/StoredProcedureExecutor.cs
    - auth-service/AuthService.Tests/Services/AuthServiceTests.cs
decisions:
  - "Use \\z (absolute end-of-string anchor) instead of $ to block trailing newlines in function name regex"
  - "Test regex placed in auth-service test project since notification/journal have no test projects yet (Phase 3 scope)"
metrics:
  duration: 10m
  completed: "2026-03-30"
  tasks_completed: 2
  files_modified: 4
---

# Phase 02 Plan 02: StoredProcedureExecutor SQL Identifier Validation Summary

**One-liner:** Defense-in-depth SQL injection guard added to both StoredProcedureExecutor implementations via ValidateFunctionName regex `^[a-zA-Z_][a-zA-Z0-9_]*\z`, rejecting metacharacters before SQL construction.

## What Was Built

Added SQL identifier validation to both StoredProcedureExecutor implementations (notification-service and journal-service). A `ValidateFunctionName` guard is called as the first statement in all four public methods of each executor. The guard uses a compiled Regex `^[a-zA-Z_][a-zA-Z0-9_]*\z` that rejects any function name containing SQL metacharacters (semicolons, quotes, dots, spaces, parentheses, newlines, tabs, dollar signs, at signs) before any SQL string is built or executed.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add ValidateFunctionName guard to both StoredProcedureExecutors | 7d66544 | notification-service/Infrastructure/StoredProcedureExecutor.cs, journal-service/Infrastructure/StoredProcedureExecutor.cs |
| 2 | Create validation tests proving SQL metacharacter rejection | f2e95d8 | auth-service/AuthService.Tests/Services/StoredProcedureValidationTests.cs, AuthServiceTests.cs |

## Verification Results

1. `dotnet build notification-service/src/NotificationService.Api/` — Build succeeded, 0 errors
2. `dotnet build journal-service/src/JournalService.Api/` — Build succeeded, 0 errors
3. `dotnet test auth-service/AuthService.Tests/ --filter "StoredProcedure"` — 30 passed, 0 failed
4. `grep -c "ValidateFunctionName(procedureName)" notification-service/.../StoredProcedureExecutor.cs` — 4
5. `grep -c "ValidateFunctionName(procedureName)" journal-service/.../StoredProcedureExecutor.cs` — 4

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use `\z` end anchor instead of `$` | `$` in .NET regex matches before trailing `\n`; `\z` is absolute end of string, correctly blocking newline injection |
| Place tests in auth-service test project | notification-service and journal-service have no test projects (Phase 3 scope); auth-service.Tests already exists and the regex pattern is identical across implementations |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed regex end anchor to block trailing newlines**
- **Found during:** Task 2 test run
- **Issue:** Regex `^[a-zA-Z_][a-zA-Z0-9_]*$` — the `$` anchor in .NET matches before `\n` at end of string, so `"name\n"` passed the validator despite containing a newline
- **Fix:** Changed `$` to `\z` (absolute end of string) in both StoredProcedureExecutor implementations and the test file
- **Files modified:** notification-service StoredProcedureExecutor.cs, journal-service StoredProcedureExecutor.cs, StoredProcedureValidationTests.cs
- **Commit:** f2e95d8

**2. [Rule 3 - Blocker] Fixed pre-existing CS0118 compile error in AuthServiceTests.cs**
- **Found during:** Task 2 (test project failed to build)
- **Issue:** `Mock<ILogger<AuthService>>` and `new AuthService(...)` were ambiguous — `AuthService` is both the root assembly namespace and the class `AIWellness.Auth.Services.AuthService`
- **Fix:** Replaced bare `AuthService` references with fully qualified `AIWellness.Auth.Services.AuthService`
- **Files modified:** auth-service/AuthService.Tests/Services/AuthServiceTests.cs
- **Commit:** f2e95d8

## Known Stubs

None.

## Self-Check: PASSED

- notification-service/src/NotificationService.Api/Infrastructure/StoredProcedureExecutor.cs — FOUND, contains ValidateFunctionName
- journal-service/src/JournalService.Api/Infrastructure/StoredProcedureExecutor.cs — FOUND, contains ValidateFunctionName
- auth-service/AuthService.Tests/Services/StoredProcedureValidationTests.cs — FOUND
- Commit 7d66544 — FOUND
- Commit f2e95d8 — FOUND
