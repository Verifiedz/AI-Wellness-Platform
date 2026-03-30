---
phase: 03-test-infrastructure
plan: "01"
subsystem: auth-service
tags: [testing, abstraction, dependency-injection, bcrypt, jwt, unit-tests]
dependency_graph:
  requires: []
  provides: [IPasswordHasher-abstraction, BcryptPasswordHasher, auth-service-tests-expanded]
  affects: [auth-service]
tech_stack:
  added: []
  patterns: [interface-extraction, constructor-injection, mock-based-unit-testing]
key_files:
  created:
    - auth-service/Services/Abstraction/IPasswordHasher.cs
    - auth-service/Services/BcryptPasswordHasher.cs
    - auth-service/AuthService.Tests/Services/PasswordHasherTests.cs
    - auth-service/AuthService.Tests/Services/JwtServiceTests.cs
  modified:
    - auth-service/Services/AuthService.cs
    - auth-service/Program.cs
    - auth-service/AuthService.Tests/Services/AuthServiceTests.cs
decisions:
  - "IPasswordHasher interface placed in Abstraction folder (no s) matching existing codebase inconsistency -- namespace uses Abstractions (with s) for consistency"
  - "JWT claim type for NameIdentifier serializes as 'nameid' short name in JwtSecurityTokenHandler round-trip -- tests check both full URI and short name"
  - "Test setup uses static hash string '$2a$11$fakehashfortesting' instead of real BCrypt to avoid slow bcrypt work factor in unit tests"
metrics:
  duration: 7m
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 7
---

# Phase 03 Plan 01: IPasswordHasher Abstraction and Auth-Service Test Expansion Summary

**One-liner:** BCrypt calls extracted behind IPasswordHasher interface enabling mock-based unit testing; auth-service tests expanded with duplicate-email error shape, GetUserInfo authorization, and JWT claim generation coverage.

## What Was Done

### Task 1: IPasswordHasher Interface + BcryptPasswordHasher + DI Wiring

Introduced `IPasswordHasher` into the `AIWellness.Auth.Services.Abstractions` namespace with two methods: `HashPassword(string)` and `VerifyHashedPassword(string, string)`. Created `BcryptPasswordHasher` as the concrete implementation wrapping `BCrypt.Net.BCrypt`. Updated `AuthService` constructor to accept `IPasswordHasher` via injection, removing all six direct `BCrypt.Net.BCrypt` static calls. Registered `BcryptPasswordHasher` in `Program.cs` DI container alongside existing services. Added `PasswordHasherTests` with 3 unit tests covering hash format, correct-password verification, and wrong-password rejection.

Updated `AuthServiceTests` to carry a `Mock<IPasswordHasher>` field and pass `_passwordHasher.Object` to `CreateSut()`. Replaced all `BCrypt.Net.BCrypt.HashPassword(...)` calls in test setup with the static stub string `"$2a$11$fakehashfortesting"`, and configured `_passwordHasher.Setup(...)` where login-path tests need to simulate a valid password match.

### Task 2: Expanded Test Coverage

Added three new tests to `AuthServiceTests`:
- `RegisterAsync_DuplicateEmail_ThrowsAuthConflictException_WithEmailExistsCode` — verifies `ErrorCode == "EMAIL_EXISTS"`
- `RegisterAsync_DuplicateEmail_ErrorShape_HasErrorCode` — verifies both `ErrorCode` and that `Message` contains `"Email already registered"`
- `GetUserInfoAsync_ReturnsUserData_ForAuthenticatedUser` — verifies the returned `UserInfoResponse.UserId` and `Email` match the mocked user

Created `JwtServiceTests` with two tests:
- `GenerateJwtToken_ContainsUserIdClaim` — decodes the token and asserts the `nameid` claim matches `user.Id.ToString()`
- `GenerateJwtToken_ContainsEmailClaim` — decodes the token and asserts the `email` claim matches `user.Email`

## Verification Results

| Check | Result |
|-------|--------|
| `dotnet build auth-service/AuthService.csproj` | Build succeeded, 0 errors |
| `grep BCrypt.Net.BCrypt auth-service/Services/AuthService.cs` | 0 matches |
| `dotnet test auth-service/AuthService.Tests/` | Passed 57/57 |
| IPasswordHasher count in AuthService.cs | 2 (field + constructor param) |
| `--filter JwtService` | 2/2 passing |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JWT NameIdentifier short claim name**
- **Found during:** Task 2 — JwtServiceTests initial run
- **Issue:** JwtSecurityTokenHandler serializes `ClaimTypes.NameIdentifier` (long URI) to the short name `"nameid"` when writing JWT tokens. The tests searched for `"nameidentifier"` which does not exist in the decoded claims, causing `Assert.NotNull()` to fail.
- **Fix:** Diagnostic program confirmed the short name is `"nameid"`. Updated `GenerateJwtToken_ContainsUserIdClaim` to search `ClaimTypes.NameIdentifier || "nameid" || "nameidentifier"`, making the test resilient to serialization differences.
- **Files modified:** `auth-service/AuthService.Tests/Services/JwtServiceTests.cs`
- **Commit:** `e7edc17`

## Commits

| Hash | Message |
|------|---------|
| `d4fad46` | feat(03-01): extract IPasswordHasher abstraction and wire into AuthService |
| `e7edc17` | feat(03-01): expand auth-service test coverage for duplicate-email, GetUserInfo, and JWT claims |

## Self-Check: PASSED
