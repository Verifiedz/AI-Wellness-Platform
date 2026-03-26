# Architecture Patterns: .NET Microservices Hardening

**Domain:** Hardening an existing .NET microservices platform (Auth, Chat, AI Wrapper)
**Researched:** 2026-03-25
**Overall Confidence:** HIGH — verified against official .NET 8 docs, official Npgsql docs, and current community patterns

---

## Recommended Architecture for Hardening

The codebase already has the right structural skeleton: three independent services behind a YARP gateway, interface-based service layers, and a test project in the AI Wrapper. Hardening should work _with_ that structure, not reshape it. Each change plugs into an existing seam.

### Current Component Map (as-audited)

```
[React Native Frontend]
        |
        | JWT in Authorization header
        v
[Auth Service — Port 500x]
  - ExceptionHandlingMiddleware  (custom, catch-all)
  - RateLimitingMiddleware       (custom, IMemoryCache)
  - AuthController
  - AuthService                  (27x generic throw new Exception())
  - JwtService
  - UserRepository
  - PostgreSQL (users, verificationcodes)
        |
        | YARP reverse proxy
        v
[Chat Service — Port 500x]
  - ChatController               (per-action try/catch blocks)
  - ChatService                  (index-based role heuristic, dummy1 status)
  - SessionService
  - ChatDatabaseProvider         (mixed NpgsqlConnection + _dataSource)
  - SessionDatabaseProvider      (same mixed pattern)
  - CacheServiceProvider         (Redis, no TTL)
  - PostgreSQL (chats, sessions)
  - Redis (session cache)
        |
        | X-Internal-Api-Key header
        v
[AI Wrapper Service — Port 500x]
  - InternalApiKeyMiddleware
  - RateLimitingMiddleware        (custom ConcurrentDictionary, IP-only)
  - ChatApi (Minimal API)
  - OpenAIChatService             (API key in default headers)
  - OpenAI API
```

---

## Component Boundaries After Hardening

### Boundary 1: Auth Service (Gateway + Auth Domain)

**Responsibility:** JWT issuance, verification, user lifecycle, and request routing to Chat Service.

**What changes:**
- `ExceptionHandlingMiddleware` upgraded: custom middleware replaced with `IExceptionHandler` chain (typed handlers per domain exception). The existing middleware catches everything as a generic `Exception`; the new chain catches `DuplicateEmailException`, `InvalidCredentialsException`, `VerificationCodeExpiredException`, etc., before the fallback handler.
- `RateLimitingMiddleware` replaced: custom `IMemoryCache` implementation replaced with the built-in `Microsoft.AspNetCore.RateLimiting` middleware, using `PartitionedRateLimiter` per IP and per email for the `verify-email` endpoint. The current implementation has a race condition on `GetOrCreate + Set` that can permit extra requests under load.
- `AuthService` domain exceptions: all 27 `throw new Exception()` calls replaced with typed exceptions (`PasswordValidationException`, `DuplicateEmailException`, `UserNotFoundException`, `InvalidCredentialsException`). These are caught by the new exception handler chain, not by `AuthController`.
- Log masking: a structured logging redaction filter added in `Program.cs` to mask emails and never log verification codes.
- `JwtService`: `ValidateLifetime = true` enforced in token validation parameters.
- Verification codes: `RandomNumberGenerator` used instead of `Random`; codes hashed before storage.

**Communicates with:**
- Frontend (inbound, JWT-authenticated)
- PostgreSQL (users, verificationcodes tables)
- Notification Service (outbound, internal API key)
- Chat Service (outbound, YARP proxy)

---

### Boundary 2: Chat Service (Session + Message Domain)

**Responsibility:** Session lifecycle, message persistence, conversation orchestration.

**What changes:**
- Exception handling: remove per-action `try/catch` blocks from `ChatController`. Instead, install `IExceptionHandler` implementations matching `SessionAccessDeniedException`, `SessionNotFoundException`, `MessageTooLongException`. The existing controller already maps `KeyNotFoundException` → 404 and `ArgumentException` → 400; the typed exceptions replace those generic stand-ins.
- Database connection hygiene: `ChatDatabaseProvider` has three methods (`createChatAsync`, `deleteChatAsync`, `getChatAsync`) that instantiate `new NpgsqlConnection(connectionString)` directly instead of calling `_dataSource.OpenConnectionAsync()`. All three must use the datasource. The datasource is already registered in the constructor via `NpgsqlDataSource.Create(connectionString)` — it just is not used in those three methods.
- Connection pool configuration: replace `NpgsqlDataSource.Create(connectionString)` with `NpgsqlDataSourceBuilder` to set explicit `MaxPoolSize` (20–50) and enable connection string validation at startup.
- Input validation: `FluentValidation` validators for `ChatRequest` (message length ≤ 4000 chars) and session name (≤ 100 chars), wired via `AddFluentValidationAutoValidation()` or explicit middleware. Validation failures produce `ValidationProblemDetails` (RFC 9457), matching the AI Wrapper's existing response contract.
- Chat role assignment: replace index-based heuristic with an explicit `role` column in the `chats` table. `chatService.cs` sets `role = "user"` for incoming messages and `role = "assistant"` for AI responses before calling `createChatAsync`. `GetChatsbySessionAsync` returns the stored role; `chatApi.js` uses it directly instead of re-deriving from index.
- Status enum: replace `Status.dummy1` with `Status.Delivered` (outgoing AI response) and `Status.Sent` (incoming user message).
- Cache TTL: `CacheServiceProvider` sets a 30-minute sliding TTL on all session entries. An `IHostedService` (background cleanup) validates cache entries against the database every 60 minutes to catch orphaned keys.
- Chat history pagination: `getChatsBySessionAsync` accepts `(Guid sessionId, int page, int pageSize)` and uses `LIMIT/OFFSET` on the SQL function. Default page size: 50.

**Communicates with:**
- Auth Service gateway (inbound, JWT-authenticated)
- PostgreSQL (chats, sessions)
- Redis (session cache)
- AI Wrapper Service (outbound, X-Internal-Api-Key)

---

### Boundary 3: AI Wrapper Service (LLM Abstraction)

**Responsibility:** OpenAI API abstraction, request normalization, internal-only access.

**What changes:**
- `RateLimitingMiddleware` replaced: custom `ConcurrentDictionary` implementation replaced with the built-in `Microsoft.AspNetCore.RateLimiting` middleware using `PartitionedRateLimiter` keyed on the `X-Internal-Api-Key` header value. This delivers per-key limiting rather than per-IP-only.
- OpenAI key exposure: `OpenAIChatService` currently stores the key in `_httpClient.DefaultRequestHeaders`. Replace with per-request header injection via a delegating handler so the key is added at send-time only and is not held in a long-lived header collection.
- Model configurability: `"gpt-4o-mini"` moved to `appsettings.json` under `OpenAI:Model`. Injected via the Options pattern (`OpenAiOptions` record with `ValidateOnStart()`).
- History deserialization: `ChatHistoryItem` list is deserialized from a JSON string on every request. This is a performance and correctness boundary; the fix (moving to structured JSONB in PostgreSQL) lives in Chat Service, but the AI Wrapper must accept the structured `IReadOnlyList<ChatHistoryItem>` DTO (which it already does) rather than a raw JSON string.

**Communicates with:**
- Chat Service (inbound, X-Internal-Api-Key)
- OpenAI API (outbound, per-request Authorization header)

---

## Data Flow After Hardening

### Chat Request Path (happy path)

```
Frontend
  └─ POST /chatService/api/chatRequest  {JWT, message, sessionId?}
       │
       │ Auth Service validates JWT (ValidateLifetime=true enforced)
       │ RateLimiter: PartitionedRateLimiter per IP (built-in)
       │
       v
  ChatController.SendChat()
       │ FluentValidation on ChatRequest (length, non-null)
       │ TryResolveCurrentUserId() (existing, unchanged)
       │
       v
  ChatService.SendChatMessageAsync()
       │ SessionService.GetOrCreateSessionAsync()
       │   └─ Redis cache lookup (30-min TTL)
       │   └─ NpgsqlDataSource.OpenConnectionAsync() on cache miss
       │
       │ ChatDatabaseProvider.getChatsBySessionAsync(sessionId, page=1, pageSize=50)
       │   └─ NpgsqlDataSource.OpenConnectionAsync() (all methods unified)
       │
       │ Serialize last 50 messages as IReadOnlyList<ChatHistoryItem>
       │
       v
  AI Wrapper: POST /chat/ChatResponse
       │ InternalApiKeyMiddleware (existing)
       │ PartitionedRateLimiter keyed on X-Internal-Api-Key (replaced)
       │ ChatApi.ValidateRequest() (existing)
       │
       v
  OpenAIChatService
       │ Per-request Authorization header injection (replaced)
       │ Model from options (moved from constant)
       │
       v
  OpenAI API → response
       │
       v
  Chat Service: persist AI response with role="assistant", status=Delivered
  Chat Service: persist user message with role="user", status=Sent
       │
       v
  Frontend receives ChatResponse {message, sessionId, ...}
```

### Error Path

```
Domain exception thrown in service layer
  └─ Propagates up to controller (no per-action catch)
       └─ IExceptionHandler chain (registered in DI):
            1. DomainExceptionHandler   → maps typed domain exceptions to ProblemDetails
            2. ValidationExceptionHandler → maps FluentValidation failures to ValidationProblemDetails
            3. FallbackExceptionHandler  → maps anything else to 500, logs full context
```

---

## Domain Exception Hierarchy

Each service owns its own exception namespace. There is no shared exception library — this avoids coupling services through a shared assembly.

### Auth Service (`AIWellness.Auth.Exceptions`)

```
AuthDomainException (base, inherits Exception)
  ├── DuplicateEmailException         → 409 Conflict
  ├── DuplicateUsernameException      → 409 Conflict
  ├── InvalidCredentialsException     → 401 Unauthorized
  ├── AccountLockedException          → 423 Locked
  ├── EmailNotVerifiedException       → 403 Forbidden
  ├── VerificationCodeExpiredException → 400 Bad Request
  ├── VerificationCodeInvalidException → 400 Bad Request
  └── PasswordValidationException     → 400 Bad Request
```

### Chat Service (`ChatService.Exceptions`)

```
ChatDomainException (base, inherits Exception)
  ├── SessionNotFoundException        → 404 Not Found
  ├── SessionAccessDeniedException    → 403 Forbidden
  ├── MessageTooLongException         → 400 Bad Request
  └── SessionNameTooLongException     → 400 Bad Request
```

### AI Wrapper Service — no new domain exceptions needed. Existing `HttpRequestException` and `TaskCanceledException` paths are already mapped to ProblemDetails in the existing exception middleware.

---

## Cross-Cutting Concern Placement

| Concern | Where It Lives | Rationale |
|---------|---------------|-----------|
| Exception handling | Per-service `IExceptionHandler` chain | Services have different domain vocabularies; shared library creates coupling |
| Rate limiting | Per-service built-in `Microsoft.AspNetCore.RateLimiting` | Each service has different limiting requirements (IP vs API key vs email) |
| Validation | FluentValidation validators in each service, auto-registered per assembly | Validators are domain-specific; no cross-service sharing needed |
| JWT validation | Auth Service `Program.cs` only | Chat Service trusts the gateway; AI Wrapper uses API key, not JWT |
| Log masking | Structured logging redaction filter per service | Each service knows its own sensitive fields |
| Connection pooling | `NpgsqlDataSourceBuilder` in each database provider | No shared infrastructure layer justified at this scale |
| ProblemDetails format | `AddProblemDetails()` in each service's `Program.cs` | Uniform response contract without a shared library |

**Why no shared BuildingBlocks library:** The BuildingBlocks pattern is appropriate for teams operating many services. This codebase has three services at capstone scale. Introducing a shared library adds a dependency management surface (versioning, breaking changes, redistribution) with no proportional benefit. Each concern is small enough to live directly in the service that owns it.

---

## Integration Test Structure

### Current State

AI Wrapper has a working `CustomWebApplicationFactory<TProgram>` with `WebApplicationFactory`. Auth Service and Chat Service have no integration tests.

### Target Structure Per Service

```
auth-service/
  AuthService.Tests/
    Integration/
      AuthRegistrationTests.cs       (register, verify-email flow)
      AuthLoginTests.cs              (login, 2FA flow)
      RateLimitingTests.cs           (brute-force on verify-email)
      JwtExpiryTests.cs              (expired token rejected)
      PasswordResetTests.cs          (token expiry, no reuse)
    Fixtures/
      AuthWebApplicationFactory.cs   (in-memory + Npgsql override)

chat-service/
  ChatService.Tests/
    Integration/
      ChatRoleAssignmentTests.cs     (role stored and returned correctly)
      SessionAuthorizationTests.cs   (User A cannot read User B's session)
      ConnectionPoolTests.cs         (no direct NpgsqlConnection usage)
    Fixtures/
      ChatWebApplicationFactory.cs   (in-memory + mock AI Wrapper client)

AI-Wrapper-Service/
  AIWrapperService.Tests/            (already exists)
    Integration/
      OpenAIErrorScenarioTests.cs    (429, token limit, model unavailable — gaps noted in CONCERNS.md)
      PerKeyRateLimitingTests.cs     (tests keyed on X-Internal-Api-Key, not just IP)
```

### Cross-Service Integration Strategy

Full cross-service tests (Auth → Chat → AI Wrapper) are out of scope for this hardening milestone. Existing `docker-compose.yml` provides the infrastructure if needed in future. Within this milestone, each service is tested in isolation with its dependencies mocked or replaced:

- Auth Service tests: PostgreSQL replaced with a test-scoped `NpgsqlConnection` against a real instance or `TestContainers.PostgreSql`. No external dependencies needed.
- Chat Service tests: PostgreSQL and Redis via Testcontainers; AI Wrapper replaced with a mock `IChatWrapperClientInterface`. The existing `IsolatedWebApplicationFactory` pattern from AI Wrapper is the template.
- AI Wrapper tests: OpenAI API mocked via `MockHttpHandler` (already done in `CustomWebApplicationFactory`). New tests cover the gap scenarios in CONCERNS.md.

---

## Build Order / Phase Dependencies

The concerns are interdependent in this order. Building out of order creates rework:

### Phase 1: Foundation (must come first)

**Domain exceptions + IExceptionHandler chain**

Reason: All other fixes throw typed exceptions. Until the exception hierarchy exists and the handler chain is wired, any typed `throw` would produce an unhandled exception hitting the old catch-all. Exception types must be defined before the service methods that use them.

Affects: Auth Service, Chat Service (AI Wrapper already has adequate exception handling).

### Phase 2: Security Fixes (builds on Phase 1)

**Log masking, verification code hardening, JWT expiry enforcement, brute-force rate limiting**

Reason: These reference the domain exceptions created in Phase 1 (e.g., `VerificationCodeInvalidException`, `AccountLockedException`). The built-in rate limiter for brute-force protection goes in here alongside the exception work.

Affects: Auth Service primarily.

### Phase 3: Connection + Validation (parallel to Phase 2 for different developer)

**Database connection unification (ChatDatabaseProvider), FluentValidation wiring, Status enum, Chat role storage**

Reason: These changes are in Chat Service and have no dependency on the Auth Service exception work. They can proceed in parallel. The role storage fix requires a database migration, which must be verified safe before deployment.

Affects: Chat Service.

### Phase 4: AI Wrapper Hardening (builds on Phase 3)

**Per-key rate limiting, per-request API key injection, model configurability, history deserialization path**

Reason: History deserialization improvement requires the Chat Service to send structured data (Phase 3). The AI Wrapper's rate limiter replacement and API key change are independent but logically grouped with Phase 3 completion.

Affects: AI Wrapper Service.

### Phase 5: Performance + Scaling

**Connection pool configuration, cache TTL policy, chat history pagination**

Reason: These can only be validated against the unified connection code from Phase 3. Pagination requires integration tests that exercise the new role column (from Phase 3).

Affects: Chat Service, minor touch in AI Wrapper (`OpenAI:Model` option).

### Phase 6: Test Coverage Gaps

**Role assignment tests, session auth boundary tests, OpenAI error scenario tests, password reset token expiry tests**

Reason: Tests must be written after the code they verify exists. Some gap tests (session auth boundary) also require the domain exceptions from Phase 1 to produce the correct response shape.

Affects: All services (new test projects for Auth and Chat; additions to AI Wrapper tests).

---

## What Does Not Change

- Service communication protocol: YARP reverse proxy remains; JWT → YARP → Chat remains; X-Internal-Api-Key header remains.
- Database schema: no table restructuring except adding a `role` column to the `chats` table (migration-safe, nullable with default).
- CORS configuration: Auth Service allows any in dev, denies in prod; Chat Service denies all; AI Wrapper internal-only. No changes.
- Frontend API contract: `chatApi.js` will use the `role` field instead of deriving it from index — this is a frontend bug fix, not a contract change. The `role` field is already present in the `Chat` DTO; it was just never populated.
- Service ports and routing: no changes to `appsettings.json` URLs.

---

## Sources

- [Global Error Handling in ASP.NET Core 8 — Milan Jovanović](https://www.milanjovanovic.tech/blog/global-error-handling-in-aspnetcore-8)
- [IExceptionHandler in .NET Microservices — Mehmet Ozkaya](https://mehmetozkaya.medium.com/global-exception-handling-with-iexceptionhandler-interface-in-net-microservices-c1ecaaa1c7ad)
- [Rate Limiting Middleware in ASP.NET Core — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0)
- [Designing Validations in the Domain Model Layer — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations)
- [Integration Tests in ASP.NET Core — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-8.0)
- [Npgsql Basic Usage and NpgsqlDataSourceBuilder — Npgsql Docs](https://www.npgsql.org/doc/basic-usage.html)
- [Cross-Cutting Concerns into BuildingBlocks Class Library — Mehmet Ozkaya](https://mehmetozkaya.medium.com/cross-cutting-concerns-into-buildingblocks-class-library-for-net-microservices-6e7b5720fd91)
- [How to Host Multiple WebApplicationFactory Instances — codegenes.net](https://www.codegenes.net/blog/aspnetcore-integration-testing-multiple-webapplicationfactory-instances/)
