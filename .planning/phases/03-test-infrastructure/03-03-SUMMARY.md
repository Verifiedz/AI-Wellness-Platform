---
phase: 03-test-infrastructure
plan: "03"
subsystem: notification-service, chat-service
tags: [testing, unit-tests, integration-tests, sec-04-regression, mocking]
dependency_graph:
  requires: []
  provides:
    - NotificationService.Tests project with 14 passing tests
    - chat-service unit tests: SessionServiceTests, ChatServiceTests, ChatControllerTests
  affects:
    - notification-service/src/NotificationService.Tests/
    - chat-service/ChatService.Tests/
tech_stack:
  added:
    - xunit 2.9.2 (NotificationService.Tests)
    - Moq 4.20.72 (NotificationService.Tests, ChatService.Tests)
    - FluentAssertions 8.0.0 (NotificationService.Tests, ChatService.Tests)
    - Microsoft.AspNetCore.Mvc.Testing 9.0.0 (NotificationService.Tests)
    - Microsoft.AspNetCore.Http 2.2.2 (ChatService.Tests)
  patterns:
    - WebApplicationFactory<Program> for notification-service controller integration tests
    - Parameterless fixture classes (xUnit constraint) with separate factory per configuration
    - ClaimsPrincipal injection into ControllerContext for controller unit tests
    - NullLogger<T> for logger dependencies in unit tests
key_files:
  created:
    - notification-service/src/NotificationService.Tests/NotificationService.Tests.csproj
    - notification-service/src/NotificationService.Tests/Controllers/NotificationCodeControllerTests.cs
    - notification-service/src/NotificationService.Tests/Services/CodeDeliveryServiceTests.cs
    - notification-service/src/NotificationService.Tests/BackgroundServices/NotificationSchedulerTests.cs
    - chat-service/ChatService.Tests/Services/SessionServiceTests.cs
    - chat-service/ChatService.Tests/Services/ChatServiceTests.cs
    - chat-service/ChatService.Tests/Controllers/ChatControllerTests.cs
  modified:
    - notification-service/src/NotificationService.Api/Program.cs (added public partial class Program)
    - chat-service/ChatService.Tests/ChatService.Tests.csproj (added Moq, FluentAssertions, Http)
    - chat-service/ChatService.Tests/Test/IntegrationTests/ChatDatabaseProvider.IntegrationTests.cs (fix pre-existing compile errors)
decisions:
  - Use WebApplicationFactory<Program> for controller tests — tests real middleware stack including CryptographicOperations.FixedTimeEquals validation
  - Separate xUnit fixture classes per configuration (not parameterized) to satisfy xUnit constraint
  - Keep NotificationSchedulerTests as pure unit tests using IServiceProvider mock — avoids real DB/push service
  - ChatControllerTests use ClaimsPrincipal on ControllerContext.HttpContext.User — avoids full web stack
  - SessionServiceTests has no connection strings — all DB access via ISessionDatabaseProvider mock
metrics:
  duration: "~12 minutes"
  completed: "2026-03-30T06:37:58Z"
  tasks_completed: 2
  files_created: 7
  files_modified: 3
  tests_added: 47
---

# Phase 03 Plan 03: Notification-Service and Chat-Service Tests Summary

New test project for notification-service (14 tests, SEC-04 regression guard) plus unit test expansion for chat-service (33 tests, SessionService/chatService/ChatController with mocked dependencies).

## What Was Built

### Task 1: Notification-Service Test Project

Created `notification-service/src/NotificationService.Tests/` as a new xUnit test project targeting net9.0.

**NotificationCodeControllerTests** (4 tests) — SEC-04 regression guard:
- `SendCode_Returns401_WhenApiKeyHeaderIsMissing` — no X-Internal-Api-Key header
- `SendCode_Returns401_WhenApiKeyIsWrong` — wrong key value
- `SendCode_Returns401_WhenApiKeyHasDifferentByteLength` — "short" key vs 32-char configured key (tests FixedTimeEquals length-mismatch path)
- `SendCode_DoesNotReturn401_WhenRequireSharedSecretIsFalse` — bypass validation when disabled

**CodeDeliveryServiceTests** (6 tests) — provider routing paths:
- Email, SMS, "both", "auto" channel routing with unconfigured providers (returns false/false)
- Null channel normalization to "auto"
- Unknown code type does not throw

**NotificationSchedulerTests** (4 tests) — constructor and lifecycle:
- Construction with mocked IServiceProvider
- Default interval when config key absent
- StopAsync before Start completes without exception
- ExecuteAsync exits cleanly when cancellation requested immediately

### Task 2: Chat-Service Unit Test Expansion

Added Moq, FluentAssertions, and Microsoft.AspNetCore.Http to `ChatService.Tests.csproj` (target framework remains net8.0).

**SessionServiceTests** (12 tests) — no connection strings, all mocked via ISessionDatabaseProvider and ICacheServiceProvider:
- CreateSessionAsync: happy path, DB callback verification, empty userId throws
- GetSessionsByUserAsync: returns from DB, empty userId throws
- UpdateSessionNameAsync: DB call verified, cache updated on cache hit
- BookmarkSessionAsync: sets bookmark, throws on session not found, throws on wrong user
- DeleteSessionAsync: deletes and removes from cache
- GetOrCreateSessionAsync: creates new on null sessionId, returns cached on cache hit

**ChatServiceTests** (6 tests) — mocked IChatWrapperClientInterface, ISessionService, IChatDatabaseProvider:
- SendChatMessageAsync: returns response, calls createChatAsync twice, throws on empty message, throws on null request, updates session name for new sessions
- GetChatsbySessionAsync: returns chats from DB, throws on empty sessionId

**ChatControllerTests** (16 tests) — ClaimsPrincipal injected via ControllerContext:
- SendChat: 200 with valid request, 400 on null request, 401 on missing identity, 400 on ArgumentException
- GetSessions: 200 with list, 401 on missing identity
- GetSessionChats: 200 with list, 401 on missing identity, 404 on KeyNotFoundException
- BookmarkSession: 204 on success, 404 on KeyNotFoundException
- DeleteSession: 204 on success, 401 on missing identity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing compile errors in ChatDatabaseProvider.IntegrationTests.cs**
- **Found during:** Task 2 — build failed before any new tests could compile
- **Issue:** Integration test used `Status.dummy1` (enum value removed in Phase 1) and called `new ChatDatabaseProvider(configService)` but constructor now requires `ILogger<ChatDatabaseProvider>` (added in a prior plan)
- **Fix:** Changed `Status.dummy1` to `Status.Active`; added `NullLogger<ChatDatabaseProvider>.Instance` as second argument
- **Files modified:** `chat-service/ChatService.Tests/Test/IntegrationTests/ChatDatabaseProvider.IntegrationTests.cs`
- **Commit:** f7a58d9

**2. [Rule 3 - Blocking] Added `public partial class Program {}` to notification-service Program.cs**
- **Found during:** Task 1 — `WebApplicationFactory<Program>` could not access the top-level `Program` class
- **Issue:** Top-level program implicit `Program` class is internal by default; test project could not reference it
- **Fix:** Added `public partial class Program { }` at end of Program.cs (standard .NET pattern, no behavior change)
- **Files modified:** `notification-service/src/NotificationService.Api/Program.cs`
- **Commit:** 15b3fab

**3. [Rule 3 - Blocking] Replaced `Microsoft.AspNetCore.TestHost` with `Microsoft.AspNetCore.Mvc.Testing`**
- **Found during:** Task 1 — `WebApplicationFactory<>` lives in `Mvc.Testing`, not `TestHost`
- **Fix:** Swapped package reference in NotificationService.Tests.csproj
- **Commit:** 15b3fab

**4. [Rule 3 - Blocking] Replaced parameterized fixture constructor with separate fixture classes**
- **Found during:** Task 1 — xUnit class fixtures must have parameterless constructors (or DI-provided dependencies); `NotificationTestFactory(bool requireSharedSecret)` caused all 4 controller tests to fail
- **Fix:** Split into `NotificationTestFactory` (RequireSharedSecret=true) and `NotificationBypassTestFactory` (RequireSharedSecret=false), each as separate xUnit fixture classes
- **Commit:** 15b3fab

## Known Stubs

None. All tests exercise real code paths (controller middleware stack through `WebApplicationFactory`, service logic through mocked interfaces).

## Self-Check: PASSED

All 7 created files confirmed present on disk.
Commits 15b3fab (Task 1) and f7a58d9 (Task 2) confirmed in git log.
All 47 tests pass (14 notification + 33 chat unit).
