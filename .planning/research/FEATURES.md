# Feature Landscape — .NET Microservices Hardening

**Domain:** Security and reliability hardening for a .NET 8 mental wellness microservices platform
**Researched:** 2026-03-25
**Confidence:** HIGH (findings verified against official .NET docs and current ecosystem sources)

---

## Framing: What "Hardening" Means Here

This is not a greenfield feature build — it is a targeted remediation milestone. Features are mapped
directly to the audit findings in `.planning/codebase/CONCERNS.md`. The categorisation below answers:
"If a team skips this, what breaks or who leaves?"

Wellness apps carry a higher user-trust obligation than generic SaaS. Users share mental health state,
emotional history, and identity credentials. A single breach or silent data-leak is a reputational
event, not just a bug.

---

## Table Stakes

Features users expect (or regulators assume). Missing any of these means the product cannot be
called production-ready for a health context.

### Security — Table Stakes

| Feature | Why Expected | Complexity | Current State | Notes |
|---------|--------------|------------|---------------|-------|
| Log PII masking (email, codes) | Users expect their email is never exposed in log pipelines; 2FA codes in logs are a direct credential leak | Low | Missing — `AuthService.cs` logs plain emails at 9+ sites; line 125 logs 2FA code | Use `Serilog.Enrichers.Sensitive` (v2.1.0, 16M+ downloads). Add `EmailAddressMaskingOperator` + custom operator to scrub verification codes. |
| Cryptographically secure verification codes | 6-digit `System.Random` codes have ~1M combinations; `RandomNumberGenerator` is the .NET baseline | Low | Missing — `GenerateRandomCode()` uses `System.Random` for all email/2FA/reset flows | Replace with `RandomNumberGenerator.GetBytes()` → alphanumeric encoding. Target 8+ character codes. `JwtService.cs` already uses this pattern — mirror it. |
| Verification code hashing before DB storage | Plaintext codes in `verificationcodes` table are a direct exposure vector if DB is compromised | Medium | Missing — codes stored plaintext; no TTL column enforced | Hash with BCrypt/Argon2 before insert. Add explicit `ExpiresAt` column. Mirror the password hashing pattern already in `PasswordValidator.cs`. |
| Brute-force protection on verify-email endpoint | No lockout on `/api/auth/verify-email` means 1M guesses are feasible | Low | Missing — existing `RateLimitingMiddleware` covers `/api/auth/login` but not verify-email | Extend `RateLimitingMiddleware` to add a per-email sliding counter for verification attempts. Lock after 5 failures. |
| Per-API-key rate limiting in AI Wrapper Service | IP-only rate limiting can be bypassed by rotating IPs; key-level limits protect OpenAI quota | Medium | Missing — `RateLimitingMiddleware` in AI Wrapper keys on IP only; `InternalApiKeyMiddleware.cs` validates key but does not count against it | Add `ConcurrentDictionary<string, RequestCounter>` keyed on extracted `X-Internal-API-Key` value, same pattern as current IP counter. |
| Input length validation before DB insert | Database column constraints are the last line of defence, not the first; silent truncation corrupts data | Low | Missing — `SessionService.cs` line 144 and `chatService.cs` line 29 have no length guards | Add FluentValidation validators for `CreateSessionRequest` and `SendChatRequest` DTOs. Validate `sessionName <= 100`, `message <= 4000` (or whatever schema column size is). Map `ValidationException` in the exception handler. |
| JWT token expiry enforcement via middleware | `ValidateLifetime = true` must be explicit; leaving it at framework default is fragile across .NET upgrades | Low | Incomplete — `JwtService.cs` sets 60-min expiry but `Program.cs` token validation parameters not confirmed to set `ValidateLifetime = true` | Explicitly set `TokenValidationParameters.ValidateLifetime = true` and `ClockSkew = TimeSpan.Zero` in every service's JWT bearer configuration. Write an integration test that sends an expired token and asserts 401. |
| API key in secure configuration, not appsettings | Storing `X-Internal-API-Key` or `OpenAI:ApiKey` in source-tracked `appsettings.json` is a secret leak | Low | Risk present — code reads from `IConfiguration`; whether keys are in committed files requires verification | Validate that no real keys exist in `appsettings.json` or `appsettings.Development.json`. Document `.env` / user-secrets / environment variable approach in code comments. |

### Error Handling — Table Stakes

| Feature | Why Expected | Complexity | Current State | Notes |
|---------|--------------|------------|---------------|-------|
| Domain-specific exception types replacing generic `Exception` | Generic `throw new Exception("Email already registered")` maps to 500 instead of 409; clients cannot distinguish error categories | Medium | Missing — 27+ generic throws in `AuthService.cs` alone; similar pattern in `chatService.cs` and `SessionService.cs` | Create typed exceptions: `DuplicateEmailException`, `PasswordValidationException`, `UserNotFoundException`, `SessionAccessDeniedException`, `InvalidVerificationCodeException`. Register them in the existing `ExceptionHandlingMiddleware`. |
| Exception handler must not leak exception type names to clients | Current handler returns `exception.GetType().Name` as `error` field — this leaks internal class names to the API consumer | Low | Present — `ExceptionHandlingMiddleware.cs` line 46 returns `exception.GetType().Name` | Replace with a safe, client-visible title string. Log the type internally. |
| Standardised ProblemDetails response shape | RFC 7807 is the .NET 8 convention; inconsistent error shapes break client error-handling code | Low | Partial — AI Wrapper has `ProblemDetails` responses (good); Auth service uses a custom JSON shape (not RFC 7807) | Migrate auth-service `ExceptionHandlingMiddleware` to emit RFC 7807 `ProblemDetails`. Use `builder.Services.AddProblemDetails()` and the native `IExceptionHandler` interface available in .NET 8. |
| Upgrade to .NET 8 `IExceptionHandler` | The manual middleware pattern auth-service uses predates .NET 8's native `IExceptionHandler` chain; `IExceptionHandler` is the current Microsoft-recommended approach | Low | Auth service uses a manual `ExceptionHandlingMiddleware`; AI Wrapper uses similar custom middleware | Register typed handlers via `builder.Services.AddExceptionHandler<T>()` in registration order. Eliminates manual middleware boilerplate. |

### Performance — Table Stakes

| Feature | Why Expected | Complexity | Current State | Notes |
|---------|--------------|------------|---------------|-------|
| Connection pooling via `NpgsqlDataSource` exclusively | Direct `new NpgsqlConnection(connectionString)` bypasses the pool; under concurrent load this causes pool exhaustion errors | Medium | Broken — `ChatDatabaseProvider.cs` mixes `_dataSource.OpenConnectionAsync()` (correct, line 91) with `new NpgsqlConnection(connectionString)` (wrong, lines 32, 52, 64) | Replace all direct `NpgsqlConnection` instantiations with `_dataSource.OpenConnectionAsync()`. Same fix needed in `SessionDatabaseProvider.cs`. |
| Explicit `MaxPoolSize` in `NpgsqlDataSourceBuilder` | Default pool size (25 in Npgsql) will exhaust under concurrent chat requests; leaving it unset logs a warning and silently limits throughput | Low | Missing — `NpgsqlDataSource.Create(connectionString)` in both providers; no pool size set | Switch to `NpgsqlDataSourceBuilder` with explicit `MaxPoolSize` (20–50 depending on concurrency target). Set `ConnectionIdleLifetime` to reclaim idle connections. |
| Chat history pagination (cursor-based) | Fetching unbounded chat history for long-running sessions will cause memory bloat and slow mobile responses | Medium | Missing — `getChatsBySessionAsync()` returns all rows; no `LIMIT`/cursor parameter | Add `int limit = 50` and `Guid? beforeChatId` parameters to `IChatDatabaseProvider.getChatsBySessionAsync()`. Update the stored procedure or function to accept them. Return a `hasMore` flag in the response DTO. |
| Session cache TTL eviction policy | Unbounded in-memory session cache grows indefinitely; for a long-running service this is a memory leak | Low | Missing — `ICacheServiceProvider` has no TTL; cache entries persist for process lifetime | Set `AbsoluteExpirationRelativeToNow` of 30–60 minutes on session cache entries. Document the eviction window in code. |

### Testing — Table Stakes

| Feature | Why Expected | Complexity | Current State | Notes |
|---------|--------------|------------|---------------|-------|
| Chat history role assignment tests | Core product behaviour — incorrect role assignment silently corrupts all AI conversation context | Medium | Missing — no test covers `chatService.SendChatMessageAsync()` role assignment or `getChatsBySessionAsync()` role field | Write unit tests for role assignment before and after the explicit `role` field is stored in DB. Add integration test verifying returned history has correct `role` for each message. |
| Session authorization boundary tests | Cross-user session access is a critical security vulnerability (User A accessing User B's sessions) | Medium | Missing — audit finding marks this as Critical priority | Write `WebApplicationFactory` integration test: authenticate as User A, try to access User B's session ID, assert 403 or 404 (not 200). |
| Password reset token expiry tests | Expired tokens accepted = authentication bypass | Low | Partial — password reset is tested but not the expiry vector specifically | Add test: create a reset code, manipulate or wait past `ExpiresAt`, attempt to use it, assert rejection. Use a fake clock / set TTL to 0 in test config. |
| OpenAI API error scenario tests | Unhandled 429, 503, timeout from OpenAI will surface as 500 to end users; the fix is only complete when the test passes | Medium | Missing — no tests for rate limit or model-unavailable paths in `OpenAIChatService.cs` | Add unit tests using `Moq` on the `HttpMessageHandler` to simulate 429, 503, timeout responses. Assert graceful error response (not unhandled exception). |

---

## Differentiators

Features that exceed what a basic hardening pass delivers. Valuable for the platform's long-term
maintainability and user trust but not blocking for a minimum production-safe release.

### Security — Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-request OpenAI API key injection | Eliminates the key persisting in `HttpClient.DefaultRequestHeaders` across all requests; reduces the exposure window if a request object is accidentally logged or traced | Medium | `OpenAIChatService.cs` line 73 sets the key as a default header. Replace with `request.Headers.Authorization = new AuthenticationHeaderValue(...)` per request in `SendAsync`. This is a one-function change but requires testing that key rotation works. |
| Configurable AI model with fallback | Pinning `gpt-4o-mini` breaks the service when OpenAI deprecates the model; making the model name config-driven plus adding a Polly-based fallback makes the service resilient to provider-side changes | Medium | Read `AiService:Model` from `IConfiguration`. Add a secondary `AiService:FallbackModel`. Wrap `HttpClient` in a Polly `ResiliencePipeline` that retries on 429/5xx with exponential backoff and tries the fallback model after N failures. |
| Serilog structured request logging with correlation IDs | Unstructured logs make incident investigation slow; correlation IDs let you trace a single user request across all three services | Medium | Add `Serilog.AspNetCore` + `UseSerilogRequestLogging()`. Propagate `traceId` via `Activity.Current?.Id` (already done in AI Wrapper's `ProblemDetails`). Apply consistently to auth-service and chat-service. |
| Constant-time response for user enumeration endpoints | Password reset flow intentionally hides email existence (good) but logs a warning that leaks enumeration to log readers | Low | Remove the warning log on line `~209` of `AuthService.cs`. Ensure the "email not found" and "email found" code paths take equivalent time (use `await Task.Delay` or ensure both hit DB). Already correctly hidden from API response. |
| Explicit stored procedure name constants | Typos in the string dictionary keys are only caught at runtime; moving to `static readonly` constants enables early detection via IDE/build | Low | Replace `Dictionary<string, string>` in `ChatDatabaseProvider` and `SessionDatabaseProvider` with `private static class Procedures { public const string Create = "..."; }`. No behaviour change; purely a safety improvement. |

### Performance — Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Chat history stored as structured JSONB | Current flow serialises JSON → stores as text → deserialises on every chat request (double round-trip); storing structured history avoids the re-parse overhead | High | Requires a database migration to change the column type to `jsonb`. The AI Wrapper `OpenAIChatService.cs` lines 92–106 and `chatService.cs` line 49 would both simplify. This is non-trivial schema work — flag for a follow-on sprint. |
| N+1 query elimination on session listing | Without batch loading, adding message-count or last-message metadata per session requires N extra queries | Medium | Add a PostgreSQL view or aggregate function returning sessions with `message_count` and `last_message_at`. Update `GetSessionsByUserAsync()` to use the view. |

### Testing — Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Connection pool exhaustion integration test | Confirms the pooling fix actually prevents exhaustion under concurrent load — without this test the fix could regress | Medium | Use `WebApplicationFactory` to fire 30+ concurrent chat requests. Assert that no `NpgsqlException` about pool exhaustion appears in test output. Requires a real PostgreSQL instance (Testcontainers). |
| Polly resilience tests for OpenAI errors | Confirms the retry and circuit breaker behaviour without depending on a live OpenAI API | Medium | Use `Moq` on `HttpMessageHandler`. Simulate 3x 429 → assert retry with backoff. Simulate 5x 500 → assert circuit breaker opens and returns a graceful degraded response. |

---

## Anti-Features

Things to deliberately not build during this hardening milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| TOTP/authenticator-app 2FA upgrade | The current 2FA is broken (weak codes) and must be fixed. Upgrading the entire 2FA mechanism to TOTP (Otp.NET library) is a new feature scope that could ship broken in other ways. | Fix the existing email/SMS code generation to use `RandomNumberGenerator`. TOTP is a future feature milestone. |
| Distributed rate limiting with Redis | The current Redis installation is for session caching. Adding distributed rate limiting adds infrastructure complexity, Redis key schema management, and new failure modes. Worth doing at scale but not at this stage. | Fix the IP-only limitation by adding per-email and per-API-key counters in the existing in-process stores. Document "move to Redis for horizontal scale" as a scaling note. |
| Full HybridCache migration | `HybridCache` (new in .NET 9 preview / .NET 8 via package) with L1+L2 and stampede protection is the ideal long-term cache layer. Migrating the current `ICacheServiceProvider` abstraction is a medium-complexity refactor. | Fix TTL eviction in the existing `IMemoryCache`-backed cache. Add a code comment flagging HybridCache as the upgrade path. |
| CQRS / MediatR pipeline behaviours for validation | Introducing MediatR + FluentValidation pipeline behaviours is architecturally sound but restructures the request pipeline across all three services. This is new architecture, not hardening. | Add FluentValidation validators registered via `RegisterValidatorsFromAssemblyContaining<T>()` with automatic ASP.NET Core model validation. No pipeline re-architecture needed. |
| Azure Key Vault / AWS Secrets Manager integration | Full secret manager integration is an infrastructure concern out of scope for application hardening. | Verify secrets are not in source-controlled `appsettings.json`. Document `dotnet user-secrets` for local dev and environment variables for production. |
| Database schema redesign | Migrating stored procedures to EF Core or Dapper with compile-time checking is a significant refactor. | Create string constants for stored procedure names to eliminate typos. Flag the full Dapper migration as a tech-debt item. |
| E2E mobile testing | The project has unit and integration tests. Adding Detox / Playwright E2E tests covering the React Native frontend is a new test infrastructure investment. | Fix the `chatApi.js` role assignment bug (the one tied to the backend fix) since it is directly caused by the backend concern. |

---

## Feature Dependencies

The following dependency order is critical. Implementing items out of order can introduce regressions.

```
Domain exceptions (typed throws)
    --> Exception handler domain mapping (IExceptionHandler with per-type handlers)
        --> ProblemDetails RFC 7807 responses (consistent shape)

RandomNumberGenerator codes
    --> Code hashing before DB insert (hash of a secure code is meaningful; hash of weak code is not)
        --> Verification code TTL column (enforced expiry only matters once codes are properly generated)

Connection pool fix (eliminate direct NpgsqlConnection)
    --> MaxPoolSize configuration (correct pool topology before tuning its size)
        --> Connection pool exhaustion test (test validates the fix is real)

Input validation (FluentValidation DTOs)
    --> ValidationException mapped in exception handler (FluentValidation throws; handler must catch it)

Chat role stored in DB
    --> Chat history role assignment test (test verifies the stored value, not the index heuristic)
        --> Frontend chatApi.js fix (frontend can only be fixed after backend returns the role field)

Pagination added to getChatsBySessionAsync
    --> Session cache TTL (pagination makes sessions bounded; cache TTL prevents unbounded accumulation)

JWT ValidateLifetime = true
    --> JWT expiry integration test (test only makes sense if enforcement is in place)
```

---

## MVP Recommendation for Hardening Sprint

Prioritise strictly by severity classification from CONCERNS.md:

**Phase 1 — Critical security fixes (ship first, unblocks trust):**
1. Log PII masking — prevent credential leaks in logs right now
2. Cryptographically secure verification codes — closes the weakest auth link
3. Verification code hashing before DB storage — completes the code security chain
4. Brute-force protection on verify-email — closes account-guessing window
5. JWT `ValidateLifetime = true` enforcement — closes the token bypass window

**Phase 2 — Known bugs (fix core correctness):**
6. Chat history role stored in DB — fixes all conversations, not just future ones
7. Frontend `chatApi.js` role assignment — dependent on Phase 2 backend fix
8. Placeholder `enums.Status.dummy1` — chat history filtering becomes meaningful

**Phase 3 — Tech debt and stability (required for production confidence):**
9. Domain-specific exceptions + exception handler upgrade to `IExceptionHandler`
10. Connection pool fix (NpgsqlDataSource exclusively) + MaxPoolSize configuration
11. Input length validation (FluentValidation on session and chat DTOs)
12. Per-API-key rate limiting in AI Wrapper

**Phase 4 — Performance and scaling (sustains the platform under real load):**
13. Chat pagination
14. Session cache TTL
15. Configurable AI model + Polly resilience for OpenAI errors

**Phase 5 — Test coverage (required to prove all fixes hold):**
16. Session authorization boundary test
17. Chat role assignment test
18. Password reset token expiry test
19. OpenAI error scenario tests

**Defer to a follow-on milestone:**
- Chat history JSONB migration (schema change, high complexity)
- N+1 query elimination (perf improvement, not correctness)
- TOTP 2FA upgrade (new feature scope)
- Distributed rate limiting with Redis

---

## Sources

- [Microsoft Docs — Handle errors in ASP.NET Core APIs](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling-api)
- [Milan Jovanović — Global Error Handling in ASP.NET Core 8](https://www.milanjovanovic.tech/blog/global-error-handling-in-aspnetcore-8)
- [Microsoft Docs — Rate Limiting Middleware in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit)
- [Redis.io — Distributed Rate Limiting in .NET](https://redis.io/tutorials/rate-limiting-in-dotnet-with-redis/)
- [Npgsql Documentation — Basic Usage and Connection Pooling](https://www.npgsql.org/doc/basic-usage.html)
- [Serilog.Enrichers.Sensitive on NuGet](https://www.nuget.org/packages/Serilog.Enrichers.Sensitive)
- [Better Stack — Best Logging Practices for Sensitive Data](https://betterstack.com/community/guides/logging/sensitive-data/)
- [Microsoft Docs — Integration Tests in ASP.NET Core 8](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-8.0)
- [Microsoft Docs — Multi-factor Authentication in ASP.NET Core 8](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/mfa?view=aspnetcore-8.0)
- [Microsoft Docs — Building Resilient Cloud Services with .NET 8](https://devblogs.microsoft.com/dotnet/building-resilient-cloud-services-with-dotnet-8/)
- [Polly GitHub — App-vNext/Polly](https://github.com/App-vNext/Polly)
- [FluentValidation — Official ASP.NET Core Docs](https://docs.fluentvalidation.net/en/latest/aspnet.html)
- [Microsoft Docs — Caching in .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/caching)
- [HIPAA Microservices Security — Konfirmity 2026](https://www.konfirmity.com/blog/hipaa-microservices-and-hipaa)
