# Architecture Patterns: Hardening a Distributed .NET Microservices System

**Domain:** Codebase hardening — security fixes, test infrastructure, reliability improvements
**Researched:** 2026-03-29
**Overall confidence:** HIGH (findings grounded in existing code inspection + verified Microsoft docs)

---

## Recommended Architecture for Hardening Work

Hardening a distributed system is not a single-pass activity. It has a natural dependency order that mirrors the runtime trust chain: the gateway and auth service sit at the perimeter and must be fixed before anything behind them can be considered secure. Test infrastructure must be established before fixes are written, so every change ships with a proof of correctness.

The recommended structure is four concentric rings, each building on the previous:

```
Ring 1 (Perimeter Security)
  auth-service + community-service auth gap
  ↓
Ring 2 (Internal Communication Security)
  notification-service timing attack + logging PII fixes
  ↓
Ring 3 (Test Infrastructure)
  Test projects for all 5 untested services + frontend Jest setup
  ↓
Ring 4 (Reliability & Debt)
  Performance, middleware order, immutability, naming, Docker config
```

---

## Component Map and Hardening Boundaries

Each service is an independent hardening unit — fixes do not cross service boundaries except at the shared-secret/gateway contract. The table below documents what each component owns and what must be fixed within it.

| Service | Hardening Owner | Critical Issues | Test Status |
|---------|----------------|-----------------|-------------|
| auth-service | Gateway + identity | 2FA log, CSPRNG, PII logging, exception exposure, GetUserInfo authz, rate limit order | Zero tests |
| community-service | User-generated content | No auth middleware at all, hardcoded DB password | Zero tests |
| notification-service | Code delivery | Timing-unsafe API key comparison, StoredProcedureExecutor injection risk | Zero tests |
| journal-service | Entry persistence | StoredProcedureExecutor injection risk, no pagination | Zero tests |
| chat-service | Session + messaging | Mutable session entity, no CancellationToken, no pagination | 1 integration test file only |
| AI-Wrapper-Service | LLM proxy | Hardcoded RunPod URL in config | Full test suite (reference implementation) |
| frontend | React Native mobile | No test framework, wearable stub, no input sanitization | Zero tests |

### Component Boundaries (hardening scope)

**auth-service** owns everything in the `auth-service/` directory. No other service should be modified to fix auth-service problems. The exception: the YARP gateway config in `auth-service/appsettings.json` is where community-service gains its first-hop protection — that config change lives in auth-service, while the shared-secret middleware lives in community-service.

**community-service** owns its own authentication middleware. The fix pattern already exists in notification-service (`UserContextMiddleware` + `DevelopmentUserContextMiddleware` + shared-secret validation in the controller). Community-service must replicate that pattern, not call out to auth-service at runtime.

**notification-service and journal-service** share an identical `StoredProcedureExecutor` bug. The fix is applied independently to each — do not attempt to extract to a shared library during this milestone (that is tech debt extraction work). Fix both files independently, test both independently.

**chat-service** is the only service with partial test coverage. Its existing test project (`ChatService.Tests`) targets .NET 8 and uses xUnit without Moq or FluentAssertions. New tests added here should upgrade to the pattern established in `AIWrapperService.Tests` (add Moq, FluentAssertions, and `Microsoft.AspNetCore.Mvc.Testing`).

**frontend** has no test framework at all. Jest + React Native Testing Library must be added to `package.json` before any tests can be written. The `"test"` script must be added to `scripts` in `package.json`.

---

## Data Flow Direction (Hardening Implications)

Understanding the trust chain determines which fixes cascade:

```
Frontend (untrusted)
  → auth-service validates JWT               [CRITICAL: fix auth-service first]
      → YARP injects X-User-Id header        [downstream services trust this]
          → chat-service (validates own JWT) [inconsistency — does not use X-User-Id]
          → notification-service (trusts X-User-Id + shared secret)
          → journal-service (trusts X-User-Id + shared secret)
          → community-service (trusts X-User-Id — NO shared secret, BROKEN)
```

This flow makes auth-service the highest-value target: every downstream service is only as secure as the gateway that authenticates requests before forwarding them.

**community-service** is the second-highest-priority security fix because it currently has NO authentication barrier. Any client that can reach port 8084 directly (including internal network actors after a container escape) can forge any user identity.

**chat-service** performs its own JWT validation independently of the gateway pattern. This inconsistency means it has an independent security surface. It must be fixed independently and is lower priority than the complete authentication gap in community-service.

---

## Patterns to Follow

### Pattern 1: Shared-Secret Gateway Validation

**What it is:** Internal services validate that a request came through the YARP gateway (not directly) by checking for a shared secret in a header.

**Where it already exists:** notification-service (`NotificationCodeController.ValidateApiKey()`), journal-service (gateway secret check in middleware or controller).

**Where it is missing:** community-service — the single most critical missing piece.

**Implementation model:** Check for the `X-Gateway-Secret` (or equivalent) header before trusting `X-User-Id`. Return `401` if absent. Use `CryptographicOperations.FixedTimeEquals()` for comparison, not `==`. This is exactly what `AI-Wrapper-Service/AIWrapperService/Middleware/InternalApiKeyMiddleware.cs` already does correctly and should be copied as the reference.

**Confidence:** HIGH — this pattern is already in production in two services in this repo.

---

### Pattern 2: Test Project Per Service (Mirroring AIWrapperService.Tests)

**What it is:** Each service gets a dedicated `.Tests` project with the following layout:

```
ServiceName.Tests/
  ServiceName.Tests.csproj
  GlobalUsings.cs
  Fixtures/
    CustomWebApplicationFactory.cs   ← service-specific factory
    TestHelpers.cs                   ← shared mock builders for this service
  Unit/
    Services/                        ← unit tests for service layer
    Middleware/                      ← unit tests for middleware
    Repositories/                    ← unit tests for data layer
  Integration/
    <Feature>Tests.cs                ← full-stack tests via HttpClient
```

**Why this structure:** `AIWrapperService.Tests` already uses this layout and is the most complete test project in the repo. It uses `CustomWebApplicationFactory<TProgram>` + `IClassFixture`, which is the xUnit-standard pattern for shared test server lifetime. New test projects should match this structure exactly.

**Package baseline for new test projects** (match AIWrapperService.Tests versions):
```xml
<PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
<PackageReference Include="xunit" Version="2.9.2" />
<PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
<PackageReference Include="coverlet.collector" Version="6.0.2" />
<PackageReference Include="FluentAssertions" Version="8.8.0" />
<PackageReference Include="Moq" Version="4.20.72" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="[match service TFM]" />
```

**TFM alignment:** auth-service targets `net9.0` → use `Microsoft.AspNetCore.Mvc.Testing` 9.x. chat-service targets `net8.0` → use version 8.x. Do not mix TFMs within a test project.

**Confidence:** HIGH — directly derived from existing working test projects in this repo.

---

### Pattern 3: CustomWebApplicationFactory with Injected Configuration

**What it is:** Each service's test factory overrides real configuration with test values, swaps real external dependencies (database, SMTP, push APIs) with mocks or stubs, and sets the environment to `"Testing"`.

**For auth-service specifically:** The factory must swap `IUserRepository` with a mock, replace `IJwtService` with a configurable test double, and override the JWT signing key so test tokens are verifiable. The PostgreSQL connection must not be required for unit tests — `IUserRepository` must be mockable.

**For notification-service:** The factory must stub `IEmailService` / Expo push client so tests do not hit SendGrid or Expo. The real database is not needed for unit tests on `CodeDeliveryService`.

**For community-service:** The factory must stub `ICommunityDbService` so unit tests on the controller and middleware run without PostgreSQL.

**Key insight:** Auth-service uses Dapper directly via `UserRepository`, not an ORM. This means the repository is the database abstraction boundary. Unit tests mock `IUserRepository`. Integration tests require either a real PostgreSQL instance or Testcontainers. For this milestone, unit tests with mocked repositories are sufficient and do not require database containers.

**Confidence:** HIGH — `CustomWebApplicationFactory.cs` in AIWrapperService.Tests is the direct reference.

---

### Pattern 4: Cryptographic Operations Replacements

**What it is:** Replace all non-cryptographic security operations with their cryptographically correct equivalents from `System.Security.Cryptography`.

**The two fixes required:**

1. `new Random()` → `RandomNumberGenerator.GetInt32(100000, 1000000)` in `auth-service/Services/AuthService.cs`. This is a one-line change to `GenerateRandomCode()` (line 290-294). The method signature does not need to change. `RandomNumberGenerator.GetInt32` is available in .NET 6+ without additional packages.

2. `==` string comparison for API keys → `CryptographicOperations.FixedTimeEquals(ReadOnlySpan<byte>, ReadOnlySpan<byte>)` in `notification-service/src/NotificationService.Api/Controller/NotificationCodeController.cs`. Convert both strings to `byte[]` via `Encoding.UTF8.GetBytes()` before comparison.

**Reference:** `AI-Wrapper-Service/AIWrapperService/Middleware/InternalApiKeyMiddleware.cs` already uses `CryptographicOperations.FixedTimeEquals` correctly and is the in-repo reference.

**Confidence:** HIGH — `System.Security.Cryptography` namespace, .NET 8/9.

---

### Pattern 5: Correct ASP.NET Core Middleware Order

**The canonical order** (verified against Microsoft docs):

```csharp
app.UseExceptionHandler();   // 1. Catch everything
app.UseRouting();            // 2. Endpoint resolution
app.UseCors();               // 3. After routing, before auth
app.UseAuthentication();     // 4. Who is the caller?
app.UseAuthorization();      // 5. What can they do?
app.UseRateLimiter();        // 6. After auth so per-user limits work
app.MapControllers();        // 7. Execute
```

**Current bug in auth-service:** `app.UseRateLimiting()` is called before `app.UseCors()` and before `app.UseAuthentication()`. CORS preflight requests (`OPTIONS`) hit the rate limiter before the auth middleware runs, consuming rate limit budget and potentially returning `429` to legitimate browser preflight requests.

**Fix:** Move `app.UseRateLimiting()` to after `app.UseAuthorization()` in `auth-service/Program.cs`. This is a single-line move, but it changes runtime behavior and must be covered by a test that sends a CORS preflight and verifies it is not rate-limited.

**Confidence:** HIGH — Microsoft official middleware order documentation, confirmed by multiple independent sources.

---

### Pattern 6: Structured Logging (No PII in Log Messages)

**What it is:** Replace string interpolation in log calls with structured logging placeholders so log-level filtering works and PII is not written verbatim to log sinks.

**Wrong:**
```csharp
_logger.LogInformation($"User registered: {request.Email}");
```

**Correct:**
```csharp
_logger.LogInformation("User registered: {Email}", request.Email);
```

**Why the distinction matters for hardening:** With interpolation, the email is concatenated into the string before the log level is checked. With structured logging, if the sink or log level filter suppresses the message, the email never gets serialized. Structured logging also enables log scrubbing at the sink level.

**2FA code fix:** The log statement `_logger.LogInformation($"2FA Code for {user.Email}: {twoFactorCode}")` must be removed entirely. No replacement is needed — the 2FA code should never appear in any log. In development environments where visibility is needed, use a debug endpoint or development-only seed data, not a log statement that will eventually reach production.

**Scope:** 15 affected call sites in `auth-service/Controllers/AuthController.cs` plus 1 in `auth-service/Services/AuthService.cs`.

**Confidence:** HIGH — .NET structured logging is a first-class framework feature; this pattern is .NET convention.

---

### Pattern 7: Generic Exception to Domain Exceptions

**What it is:** Replace `throw new Exception("message")` with typed domain exception classes that the exception handling middleware can map to specific HTTP status codes.

**Domain exceptions needed for auth-service:**
- `DuplicateEmailException` → 409 Conflict
- `AccountLockedException` → 423 Locked (or 401 with a body)
- `InvalidCredentialsException` → 401 Unauthorized
- `InvalidTokenException` → 400 Bad Request
- `UserNotFoundException` → 404 Not Found

**Where to place them:** `auth-service/Exceptions/` directory (new). Each exception inherits from `Exception` and carries only a message. The existing `ExceptionHandlingMiddleware` (or a new one) maps them in a switch expression.

**Build order constraint:** Domain exceptions must exist before the fix to `AuthController` (which currently returns `ex.Message` directly). The exception types and their middleware mappings are a prerequisite for the "don't expose exception messages" fix.

**Confidence:** HIGH — standard .NET domain exception pattern, no external dependencies.

---

### Pattern 8: Frontend Test Setup (Jest + React Native Testing Library)

**What it is:** Add Jest as the test runner and React Native Testing Library as the component testing utility to the `frontend/` package.

**Required additions to `package.json`:**
```json
"scripts": {
  "test": "jest --watchAll=false"
},
"devDependencies": {
  "jest": "^29.7.0",
  "@testing-library/react-native": "^12.9.0",
  "@testing-library/jest-native": "^5.4.3",
  "jest-expo": "~54.0.0",
  "babel-jest": "^29.7.0",
  "@types/jest": "^29.5.0"
}
```

**jest.config.js** (or `jest` key in package.json):
```json
{
  "preset": "jest-expo",
  "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
  ]
}
```

**Note on `jest-expo` version:** Pin to `~54.0.0` to match `expo: ~54.0.33`. Mismatched versions cause transformer errors. `jest-expo` is the correct preset for Expo-managed projects — it handles Metro bundler compatibility.

**Priority test targets (in order):**
1. `AuthContext.js` — most business logic, tests login/logout/persist/restore flows
2. `api.js` — the singleton ApiClient; tests token injection, error handling, timeout
3. `chatApi.js` — `sendMessage`, `normalizeMessage`, `normalizeSession` — tests normalization logic that handles PascalCase/camelCase inconsistency

**Confidence:** MEDIUM — `jest-expo` version pinning is based on known Expo/Jest compatibility patterns; verify against Expo 54 release notes before committing.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fixing Security Issues Without Tests

**What it looks like:** Change `new Random()` to `RandomNumberGenerator`, commit, move on.

**Why it's wrong for this milestone:** The project requirement states "every fix must include a test proving the concern is resolved." A security fix without a test will re-regress silently. Every security change must have an accompanying test that would fail if the fix were reverted.

**Example:** The CSPRNG fix needs a test that calls `GenerateRandomCode()` multiple times and asserts that results are not sequentially predictable (or at minimum, that the method uses `RandomNumberGenerator` — mockable via a seam if needed).

---

### Anti-Pattern 2: Sharing a Test Project Across Multiple Services

**What it looks like:** One `Shared.Tests` project with tests for auth-service, notification-service, and community-service together.

**Why it's wrong:** Each service has a separate `Program.cs` entry point. `WebApplicationFactory<TProgram>` requires a single `TProgram`. Combining services into one test project requires cross-project references and creates dependency cycles. The existing pattern (one `.Tests` project per service) is correct and must be maintained.

**Instead:** Each service gets its own test project. Shared test utilities (mock factories, JWT helper methods) are duplicated across projects in a `Fixtures/TestHelpers.cs` file per project. The code duplication is acceptable — test code is not shipped to production.

---

### Anti-Pattern 3: Extracting `StoredProcedureExecutor` to Shared Library During This Milestone

**What it looks like:** Create a `Shared/` NuGet package project, move `StoredProcedureExecutor.cs` there, update both services to reference it.

**Why it's wrong now:** This is tech debt extraction — valuable but introduces build system changes (new project, new references, version management) mid-hardening. The risk of introducing a regression during a security milestone outweighs the benefit. Apply the function-name whitelist fix to both `journal-service` and `notification-service` independently, with a comment noting the duplication. Schedule extraction as a separate milestone task after hardening is complete.

---

### Anti-Pattern 4: Integration Tests Requiring Live Docker Compose

**What it looks like:** Integration tests that `docker-compose up` the full stack and run end-to-end.

**Why it's wrong for this milestone:** Full Docker Compose integration tests are slow, fragile, and require infrastructure setup. The existing `ChatDatabaseProvider.IntegrationTests.cs` already makes this mistake (it requires a live PostgreSQL instance). New tests should use `WebApplicationFactory` with mocked repositories/services. Reserve real database tests for when Testcontainers is configured — that is a separate infrastructure decision not in scope for this milestone.

---

## Scalability Considerations

These are not performance milestones, but the hardening decisions made now affect future scalability options:

| Concern | Current State | Hardening Decision | Scalability Impact |
|---------|--------------|--------------------|--------------------|
| Rate limiting | In-memory `ConcurrentDictionary` | Document as single-instance only | Acceptable for capstone; Redis migration is out of scope |
| Session cache | Redis (chat-service only) | No change | Already scalable |
| CancellationToken propagation | Missing in chat-service | Add to controller-service chain | Enables proper graceful shutdown under load |
| Pagination | Missing on chat history | Add limit/offset stored procedure params | Prevents unbounded query results |

---

## Service Hardening Order and Build Dependencies

This is the critical section for roadmap phase structure. Dependencies between fixes determine what must come first.

### Dependency Graph

```
[1] auth-service security fixes (2FA log, CSPRNG, PII logging, GetUserInfo authz)
  → these are independent of each other within auth-service
  → must precede: auth-service test project (tests verify the fixes)
  → must precede: exception type extraction (needed for "don't expose ex.Message")

[2] Domain exception types (auth-service/Exceptions/)
  → prerequisite for: exception exposure fix in AuthController
  → prerequisite for: exception handling middleware mapping

[3] community-service authentication middleware
  → independent of auth-service fixes
  → must precede: community-service test project
  → hardcoded DB password fix is independent, can be done in same pass

[4] notification-service timing fix
  → independent of all other services
  → can be done in parallel with auth-service fixes
  → must precede: notification-service test project

[5] journal-service StoredProcedureExecutor fix
  → independent of all other services
  → must precede: journal-service test project

[6] Test projects (auth, community, notification, journal, chat expansion)
  → depend on security fixes being in place (tests verify the fixed behavior)
  → each service test project is independent of the others

[7] Frontend test setup
  → independent of all backend fixes
  → must precede: frontend unit tests

[8] Performance and reliability fixes (pagination, CancellationToken, middleware order)
  → can run concurrently with test project creation
  → middleware order fix should have test coverage before it lands

[9] Docker / deployment config fixes
  → fully independent, no code dependencies
  → low risk, can be done in a dedicated pass at any point
```

### Recommended Phase Order for Roadmap

**Phase 1 — Perimeter Security (auth-service + community-service)**
Fix the two services that control access. Everything downstream depends on these being correct.
- auth-service: 2FA log removal, CSPRNG replacement, PII logging fix, GetUserInfo authorization, exception exposure (requires domain exception types first)
- community-service: Add shared-secret validation middleware, remove unauthenticated fallback, remove hardcoded DB password
- AI-Wrapper-Service: Remove hardcoded RunPod URL

**Phase 2 — Internal Communication Security (notification-service)**
Fix the one internal service-to-service security issue.
- notification-service: Timing-safe API key comparison
- Both StoredProcedureExecutor files: Function name whitelist validation
- Rate limiting middleware registration order in auth-service

**Phase 3 — Test Infrastructure**
Establish test projects for all untested services. This phase is explicitly about infrastructure, not feature tests.
- Create test projects: `auth-service.Tests`, `community-service.Tests`, `journal-service.Tests`, `notification-service.Tests`
- Expand `chat-service.Tests`: add Moq + FluentAssertions, add SessionService and ChatController unit tests
- Frontend: add Jest + React Native Testing Library, configure `jest.config.js`
- Write tests proving all Phase 1 and 2 fixes are correct

**Phase 4 — Reliability and Performance**
Address the issues that affect correctness and resilience under real load.
- Chat pagination (limit/offset stored procedure)
- CancellationToken propagation through chat-service
- Session entity immutability in SessionService
- Input sanitization for user-generated content

**Phase 5 — Tech Debt and Configuration**
Low-risk cleanup that does not change security posture or functional behavior.
- Chat service PascalCase naming standardization
- Domain exception types for auth-service (if not done in Phase 1)
- Docker Compose: remove host-exposed database ports, add auth-service health check, remove default password fallbacks
- `.env.example` enumeration of all required variables
- Firebase service account startup validation
- Wearable service stub removal from UI (or clear "not implemented" state)

---

## Sources

- Microsoft Learn — Integration tests in ASP.NET Core: https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests
- Microsoft Learn — Middleware ordering in ASP.NET Core: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/
- Microsoft Learn — Securing .NET Microservices: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/secure-net-microservices-web-applications/
- ByteCrafted — Correct Middleware Order: https://bytecrafted.dev/posts/aspnet-core/middleware-order-best-practices/
- ByteCrafted — Integration Testing with WebApplicationFactory: https://bytecrafted.dev/integration-testing-aspnet-core-webapplicationfactory/
- OWASP Microservices Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Microservices_Security_Cheat_Sheet.html
- antondevtips — ASP.NET Core Integration Testing Best Practices: https://antondevtips.com/blog/asp-net-core-integration-testing-best-practises
- In-repo reference: `AI-Wrapper-Service/AIWrapperService.Tests/Fixtures/CustomWebApplicationFactory.cs` (HIGH confidence — live code)
- In-repo reference: `AI-Wrapper-Service/AIWrapperService/Middleware/InternalApiKeyMiddleware.cs` (HIGH confidence — correct timing-safe comparison already in use)
