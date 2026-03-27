# Project Research Summary

**Project:** AI Wellness Platform — Hardening Milestone
**Domain:** .NET 8 microservices security, reliability, and performance hardening
**Researched:** 2026-03-25
**Confidence:** HIGH (all four research areas verified against official .NET docs and NuGet.org)

---

## Executive Summary

The AI Wellness Platform has a structurally sound microservices skeleton (Auth Service, Chat Service, AI Wrapper behind a YARP gateway) but contains a cluster of audited vulnerabilities and bugs that prevent production readiness. This is a targeted hardening milestone, not a feature build: the work remediates specific, verified findings from CONCERNS.md rather than introducing new capabilities. Experts building .NET 8 microservices in a health context apply a layered defence posture — typed domain exceptions mapped through `IExceptionHandler` chains, structured logging with PII redaction, cryptographically sound token generation, and connection-pool-safe data access — and that is precisely the remediation shape required here.

The recommended approach is to sequence work strictly by dependency: exception infrastructure must exist before any typed throws can be mapped; verification code generation must be secured before hashing can be applied; database connection unification must precede pool-size tuning. Attempting these out of order causes rework. Four library additions cover every gap — FluentValidation 12.1.1 (validation), ErrorOr 2.0.1 (result pattern), Microsoft.Extensions.Http.Resilience 8.5.0 (OpenAI resilience), and Serilog.AspNetCore 10.0.0 + Serilog.Enrichers.Sensitive 2.1.0 (structured logging with redaction) — plus ASP.NET Core 8's built-in rate limiter (no package needed) and Testcontainers for integration tests against real infrastructure.

The key risks are all operational: migrating the exception handler changes the HTTP error contract the React Native frontend already consumes, adding a `role` column to the chats table creates null-backfill exposure for existing rows, and hashing verification codes mid-deploy can lock out users already in a verification flow. Each of these pitfalls has a well-documented prevention strategy (contract audit before migration, backfill SQL in the migration script, deploy TTL column before the hashing change) and these prevention steps must be treated as blocking prerequisites, not optional follow-up work.

---

## Key Findings

### Recommended Stack Additions

The existing stack already provides the test infrastructure (xUnit, Moq, FluentAssertions, coverlet), password hashing (BCrypt.Net-Next), and JWT handling (System.IdentityModel.Tokens.Jwt + JwtBearer). The additions below are additive only — they fill specific gaps identified in the audit.

**Core additions:**

| Package | Version | Services | Purpose |
|---------|---------|----------|---------|
| `FluentValidation` | 12.1.1 | auth-service, chat-service | Request DTO validation — manual injection only, NOT `.AspNetCore` auto-validation |
| `FluentValidation.DependencyInjectionExtensions` | 12.1.1 | auth-service, chat-service | Assembly-scan registration |
| `ErrorOr` | 2.0.1 | auth-service, chat-service, AI-Wrapper | Discriminated union replacing generic throw/catch |
| `Microsoft.Extensions.Http.Resilience` | 8.5.0 | AI-Wrapper-Service | Retry + circuit breaker for OpenAI HTTP calls (replaces deprecated `Http.Polly`) |
| `Serilog.AspNetCore` | 10.0.0 | auth-service, chat-service | Structured logging host integration |
| `Serilog.Enrichers.Sensitive` | 2.1.0 | auth-service | Property-name-based PII masking (Email, Code, VerificationCode) |
| `Testcontainers.PostgreSql` | 4.11.0 | auth-service.Tests, chat-service.Tests | Real PostgreSQL per test class — SQLite cannot substitute (stored procedures, JSONB) |
| `Testcontainers.Redis` | 4.10.0 | chat-service.Tests | Real Redis for session cache TTL tests |
| `BenchmarkDotNet` | 0.15.8 | \*.Benchmarks (new project) | Microbenchmarks proving deserialization fix value |
| `dotnet-reportgenerator-globaltool` | 5.5.4 | Dev tooling | HTML coverage from existing coverlet XML |
| ASP.NET Core 8 built-in rate limiter | SDK built-in | auth-service, AI-Wrapper | No NuGet needed — `AddRateLimiter` / `UseRateLimiter` |

**Do not add:** `FluentValidation.AspNetCore` (deprecated auto-validation), `Microsoft.Extensions.Http.Polly` (officially deprecated), `AspNetCoreRateLimit` (superseded), `MediatR` (overkill for this scope), `AutoMapper` (not needed).

### Table Stakes Features

Security (required before production in any health context):

- Log PII masking — emails logged at 9+ sites in `AuthService.cs`; 2FA codes potentially logged at line 125; use `Serilog.Enrichers.Sensitive` with `EmailAddressMaskingOperator`
- Cryptographically secure verification codes — `System.Random` in `GenerateRandomCode()` replaced with `RandomNumberGenerator.GetBytes()`; target 8+ character alphanumeric codes
- Verification code hashing before DB storage — plaintext codes in `verificationcodes` table; hash with HMACSHA256 (not bcrypt — unnecessary work factor for 5-minute codes)
- Verification code TTL column — explicit `ExpiresAt` column added before hashing change deploys (dependency order)
- Brute-force protection on `/api/auth/verify-email` — existing `RateLimitingMiddleware` covers login but not verify-email; add per-email sliding window limiter
- Per-API-key rate limiting in AI Wrapper — current implementation keys on IP only; add `ConcurrentDictionary` keyed on `X-Internal-API-Key` value
- Input length validation — `SessionService.cs` line 144 and `chatService.cs` line 29 have no guards; FluentValidation on `CreateSessionRequest` (sessionName ≤ 100) and `SendChatRequest` (message ≤ 4000)
- JWT `ValidateLifetime = true` with `ClockSkew = TimeSpan.Zero` — enforce explicitly; confirm no `.Development` override sets it false

Error handling (required for correct client behaviour):

- Domain-specific exception types — 27+ generic `throw new Exception()` in `AuthService.cs` alone; replace with typed hierarchy (`DuplicateEmailException`, `InvalidCredentialsException`, etc.)
- Exception handler must not leak class names — `ExceptionHandlingMiddleware.cs` line 46 returns `exception.GetType().Name` to the client
- RFC 7807 `ProblemDetails` response shape — auth-service uses a custom shape; AI Wrapper already uses ProblemDetails (inconsistency)
- Upgrade to .NET 8 `IExceptionHandler` — replace manual middleware with typed handler chain registered in DI

Performance (required to sustain concurrent load):

- Connection pooling exclusively via `NpgsqlDataSource` — `ChatDatabaseProvider.cs` mixes `_dataSource.OpenConnectionAsync()` (correct) with `new NpgsqlConnection(connectionString)` (wrong) in 3 methods
- Explicit `MaxPoolSize` via `NpgsqlDataSourceBuilder` — default 25 connections will exhaust under concurrent chat requests
- Chat history pagination — `getChatsBySessionAsync()` returns all rows; add `limit = 50` and `Guid? beforeChatId` cursor parameter
- Session cache TTL eviction — `ICacheServiceProvider` has no TTL; cache grows indefinitely

Testing (required to prove fixes hold):

- Session authorization boundary test — User A accessing User B's sessions is a critical finding; requires Testcontainers for real DB `WHERE userId = @userId` enforcement
- Chat role assignment test — no test covers `chatService.SendChatMessageAsync()` role assignment
- Password reset token expiry test — current tests do not cover the expiry path
- OpenAI API error scenario tests — no tests for 429, 503, or timeout from OpenAI

**Known bugs to fix (separate from security):**

- Chat history role stored in DB — current index-based heuristic (`dummy1` status) corrupts conversation context
- Frontend `chatApi.js` role assignment — dependent on backend fix; remove index fallback only after confirming all DB rows backfilled
- `enums.Status.dummy1` — replace with `Status.Delivered` and `Status.Sent` (with integer-ordinal safe migration)

**Defer to follow-on milestone:**

- Chat history JSONB migration (schema change, high complexity)
- TOTP/authenticator-app 2FA upgrade (new feature scope)
- Distributed rate limiting with Redis (infrastructure complexity)
- Full HybridCache migration
- CQRS/MediatR pipeline behaviours
- N+1 query elimination on session listing

### Architecture Approach

The three services retain their current communication topology (YARP proxy, JWT at gateway, `X-Internal-Api-Key` between Chat and AI Wrapper). No new services, shared libraries, or communication patterns are introduced. Each hardening change plugs into an existing seam. The `IExceptionHandler` chain replaces the current catch-all middleware; the built-in rate limiter replaces custom `IMemoryCache` and `ConcurrentDictionary` implementations; `NpgsqlDataSourceBuilder` replaces `NpgsqlDataSource.Create()`; Serilog replaces `ILogger<T>` calls that touch PII.

**Major components after hardening:**

1. **Auth Service** — `IExceptionHandler` chain with typed domain exceptions (`AIWellness.Auth.Exceptions` namespace); Serilog with `Enrichers.Sensitive` masking email/code properties; `PartitionedRateLimiter` per-IP and per-email on verify-email; `RandomNumberGenerator`-based verification codes hashed with HMACSHA256; `ValidateLifetime = true` confirmed in `TokenValidationParameters`
2. **Chat Service** — Unified `NpgsqlDataSource.OpenConnectionAsync()` across all 6 affected methods; `NpgsqlDataSourceBuilder` with explicit `MaxPoolSize`; `IExceptionHandler` chain with `SessionAccessDeniedException`/`MessageTooLongException`; FluentValidation on `ChatRequest` and session name; `role` column on chats table with backfill migration; 30-minute sliding TTL on session cache; cursor-based pagination on `getChatsBySessionAsync`
3. **AI Wrapper Service** — `PartitionedRateLimiter` keyed on `X-Internal-Api-Key`; per-request Authorization header injection via delegating handler; `OpenAI:Model` moved to options pattern with `ValidateOnStart()`; `AddStandardResilienceHandler()` wrapping `HttpClient` for retry + circuit breaker
4. **Test projects (new for Auth and Chat)** — `WebApplicationFactory`-based integration tests with Testcontainers; `TestAuthHelper` wrapping real `JwtService` (no hardcoded secrets in tests)

**Cross-cutting placement:** Exception handling, rate limiting, validation, and log masking each live per-service — no shared BuildingBlocks library. At three-service capstone scale, a shared library adds dependency management cost with no proportional benefit.

### Critical Pitfalls

1. **Breaking the API contract when refactoring exception handling** — The React Native frontend currently reads error response fields from `{ "message": "..." }` shaped responses. Migrating to RFC 7807 `ProblemDetails` changes the shape and the status codes (e.g., wrong password goes from 500 to 401). Audit every frontend error-reading call site before touching exception handling; ship the `IExceptionHandler` chain as a passthrough first; migrate exceptions one at a time; update the frontend in the same PR as the first service that emits ProblemDetails.

2. **Hashing verification codes without a migration path for in-flight plaintext codes** — Users who received a verification email before deployment will fail verification after restart because the stored value is plaintext but the lookup now hashes the input. Prevention: deploy the `ExpiresAt` TTL column migration first, expire (delete) all rows older than 5 minutes at deploy time, and handle the plaintext-in-flight state by rejecting and forcing re-generation rather than comparing across formats.

3. **NpgsqlDataSource recreated per-request defeating the connection pool** — If `NpgsqlDataSource` is built with `=>` (expression body) rather than `=` (assigned singleton field), a new pool is created on every access and PostgreSQL hits `max_connections` under load. Prevention: register exactly once in `Program.cs` via `builder.Services.AddNpgsqlDataSource()`; inject via DI; use `await using` for all connections.

4. **Chat role migration leaving null roles that break existing session history** — Adding a nullable `role` column without a backfill leaves all existing rows returning `null`, which the updated frontend code (that no longer uses the index heuristic) cannot render. Prevention: include `UPDATE chat SET role = CASE WHEN (ROW_NUMBER() OVER (...)) % 2 = 1 THEN 'user' ELSE 'assistant' END` in the migration; keep the index-based fallback in `chatApi.js` active for at least one week post-migration.

5. **PostgreSQL schema migrations acquiring table locks under concurrent traffic** — `ALTER TABLE ADD COLUMN` acquires `AccessExclusiveLock`. Combined with connection pool contention at startup, this causes apparent hangs. Prevention: run migrations as a separate pre-startup step (init container or `dotnet ef database update` before `dotnet run`); add columns as nullable first; use `IF NOT EXISTS` for idempotency; test against Testcontainers with pre-existing data.

---

## Implications for Roadmap

Based on the dependency chain identified across all four research files, six phases are suggested. The ordering is strict — phases 1 and 3 are prerequisites for everything that follows; phase 3 Chat Service work and phase 2 Auth Service work can proceed in parallel across developers.

### Phase 1: Exception Infrastructure (Foundation)

**Rationale:** All typed throws (phases 2, 3) require the exception hierarchy and handler chain to be in place first. Shipping typed exceptions without the handler produces unhandled exceptions hitting the old catch-all — no improvement, added confusion. This must come first and must include the frontend contract audit as its first task.
**Delivers:** Domain exception namespaces for Auth and Chat services; `IExceptionHandler` chain replacing `ExceptionHandlingMiddleware`; RFC 7807 `ProblemDetails` response shape; exception class names no longer leaked to clients
**Addresses:** Domain-specific exception types, exception class name leak, ProblemDetails standardisation, `IExceptionHandler` upgrade
**Avoids:** Breaking the API contract (Pitfall 1) — audit frontend error handling before any changes; deploy handler as passthrough first

### Phase 2: Auth Service Security Hardening (builds on Phase 1)

**Rationale:** All Auth security fixes reference the domain exceptions created in Phase 1 (`VerificationCodeInvalidException`, `AccountLockedException`). The TTL column migration must precede the hashing change (Pitfall 2 prevention). Log masking must precede any other Auth changes — otherwise the other fixes create new log events that contain PII.
**Delivers:** Serilog + `Enrichers.Sensitive` masking email and code properties; `RandomNumberGenerator`-based verification codes; HMACSHA256 hashing before DB storage; `ExpiresAt` TTL column on `verificationcodes`; `PartitionedRateLimiter` on verify-email endpoint; JWT `ValidateLifetime = true` confirmed
**Uses:** `Serilog.AspNetCore` 10.0.0, `Serilog.Enrichers.Sensitive` 2.1.0, ASP.NET Core 8 built-in rate limiter
**Avoids:** Pitfall 2 (code hashing without TTL migration first), Pitfall 7 (wrong middleware order), Pitfall 11 (string interpolation bypassing redaction)

### Phase 3: Chat Service Core Bugs + Stability (parallel to Phase 2)

**Rationale:** Chat Service changes have no dependency on Auth Service exception work — they can proceed in parallel. The `role` column migration must include a backfill; the `dummy1` enum must be renamed with ordinal-safe migration. Connection pool unification is a prerequisite before pool size tuning.
**Delivers:** Unified `NpgsqlDataSource.OpenConnectionAsync()` across all 6 affected methods; `NpgsqlDataSourceBuilder` with `MaxPoolSize`; `role` column on chats table with backfill migration; `Status.Delivered` / `Status.Sent` replacing `dummy1`; FluentValidation on `ChatRequest` and session name DTOs; `SessionAccessDeniedException` wired through `IExceptionHandler`
**Uses:** `FluentValidation` 12.1.1, `FluentValidation.DependencyInjectionExtensions` 12.1.1, ASP.NET Core 8 built-in rate limiter
**Avoids:** Pitfall 5 (datasource recreated per-request), Pitfall 6 (deprecated auto-validation), Pitfall 10 (null roles on existing rows), Pitfall 13 (enum ordinal shift)

### Phase 4: AI Wrapper Service Hardening (builds on Phase 3)

**Rationale:** History deserialization improvement requires Chat Service to send structured data (Phase 3 complete). Per-key rate limiting, per-request API key injection, and model configurability are independent of Auth work but logically grouped with Chat Service completion.
**Delivers:** `PartitionedRateLimiter` keyed on `X-Internal-Api-Key`; per-request Authorization header via delegating handler (key no longer in `DefaultRequestHeaders`); `OpenAI:Model` options pattern with `ValidateOnStart()`; `AddStandardResilienceHandler()` for retry + circuit breaker on OpenAI HTTP client; `RedactLoggedRequestHeaders(["Authorization"])` on named HTTP client
**Uses:** `Microsoft.Extensions.Http.Resilience` 8.5.0, `ErrorOr` 2.0.1
**Avoids:** Pitfall 9 (API key leaking into HTTP debug logs)

### Phase 5: Performance and Scaling (builds on Phase 3)

**Rationale:** Performance tuning can only be validated against the unified connection code from Phase 3. Pagination integration tests exercise the new `role` column. Cache TTL work validates cleanly once the session model is stable.
**Delivers:** `MaxPoolSize` configuration tuned via `NpgsqlDataSourceBuilder`; cursor-based pagination on `getChatsBySessionAsync` (limit=50, `beforeChatId` cursor, `hasMore` flag); 30-minute sliding TTL on session cache entries; background `IHostedService` for orphaned cache key cleanup; `BenchmarkDotNet` project proving deserialization improvement
**Uses:** `BenchmarkDotNet` 0.15.8 (isolated `.Benchmarks` project only)

### Phase 6: Test Coverage Gaps (after all fixes are in place)

**Rationale:** Tests must be written after the code they verify exists. Session authorization boundary tests require domain exceptions from Phase 1 to produce the correct response shape. Role assignment tests require the `role` column from Phase 3. OpenAI error scenario tests require the resilience handler from Phase 4.
**Delivers:** `AuthService.Tests` integration project with `WebApplicationFactory`; `ChatService.Tests` integration project with Testcontainers; session authorization boundary test (User A cannot access User B's sessions); chat role assignment test; password reset token expiry test; OpenAI 429/503/timeout error scenario tests; per-key rate limiting tests; HTML coverage report via `ReportGenerator`
**Uses:** `Testcontainers.PostgreSql` 4.11.0, `Testcontainers.Redis` 4.10.0, `dotnet-reportgenerator-globaltool` 5.5.4
**Avoids:** Pitfall 8 (brittle JWT construction in tests — use `TestAuthHelper` wrapping real `JwtService`)

### Phase Ordering Rationale

- Phase 1 before everything: typed exceptions must exist before any service throws them; handler chain must exist before it can catch them
- Phase 2 and Phase 3 are parallel: Auth Service and Chat Service changes are independent; separate developers can proceed simultaneously
- Phase 3 before Phase 4: AI Wrapper history path depends on structured data from Chat Service
- Phase 3 before Phase 5: pool tuning and pagination validation require unified connection code
- Phase 6 last: tests validate the fixes, not the pre-fix state; some tests (session auth boundary, role assignment) cannot be written until the fix is in place
- Frontend `chatApi.js` role fix ships with Phase 3 backend change but the index fallback must remain active until confirmed all DB rows are backfilled (one week minimum)

### Research Flags

Phases likely needing deeper implementation research during planning:
- **Phase 2 (verification code hashing):** The in-flight plaintext migration path is nuanced. HMACSHA256 vs bcrypt trade-off for short-lived codes needs a decision record. Recommend `/gsd:research-phase` before implementation.
- **Phase 3 (chat role backfill migration):** The SQL backfill heuristic (`ROW_NUMBER() OVER PARTITION BY session_id ORDER BY created_at`) assumes alternating roles — this may be wrong for sessions with consecutive user messages. Needs validation against real data samples.
- **Phase 5 (pagination):** Cursor-based pagination vs `LIMIT/OFFSET` trade-off depends on whether the stored procedure can be altered. If stored procedures are locked, `OFFSET` is the fallback. Verify stored procedure ownership before committing to cursor approach.

Phases with well-documented patterns (can skip research-phase):
- **Phase 1 (IExceptionHandler chain):** Milan Jovanović's reference implementation is definitive; official .NET 8 docs cover `AddProblemDetails()` thoroughly
- **Phase 4 (HTTP resilience):** `AddStandardResilienceHandler()` is a one-call change with well-documented defaults
- **Phase 6 (Testcontainers integration tests):** Pattern is established in AI Wrapper's existing `CustomWebApplicationFactory`; replicate the pattern

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 9 packages version-verified on nuget.org; deprecations confirmed via GitHub issues and official docs |
| Features | HIGH | Mapped directly to audited CONCERNS.md findings; no speculative features included |
| Architecture | HIGH | Verified against official .NET 8 docs, Npgsql docs, and official IExceptionHandler guidance |
| Pitfalls | HIGH | 5 critical pitfalls verified against OWASP 2025, Npgsql GitHub issues, and .NET community consensus |

**Overall confidence:** HIGH

### Gaps to Address

- **Frontend error contract:** The current shape of error responses the React Native frontend actually reads has not been audited in this research. This is the highest-risk gap. Audit `frontend/src/services/chatApi.js` and auth equivalents before starting Phase 1. If the contract is more complex than assumed (nested `.error.message.text` etc.), the ProblemDetails migration scope expands.
- **Stored procedure ownership:** Whether the stored procedures in Chat and Session database providers can be modified (to add pagination parameters) depends on deployment ownership. If procedures are managed outside the application repo, Phase 5 pagination requires a different implementation path (`OFFSET` on the application layer rather than procedure alteration).
- **Existing `verificationcodes` row TTL:** The current table has no `ExpiresAt` column, meaning rows may be indefinitely old. The size of the table at deployment time is unknown. If it is large, the Phase 2 expiry-delete migration step should be tested with an `EXPLAIN ANALYZE` before production deployment.
- **`dummy1` storage format:** PITFALLS.md notes that the `dummy1` enum rename risk depends on whether the value is stored as an integer or string in PostgreSQL. This must be verified by inspecting the schema before Phase 3 begins.
- **Serilog version alignment:** `Serilog.AspNetCore` 10.0.0 targets .NET 8+ but the major version tracks `Microsoft.Extensions.Hosting`, not the runtime version. Confirm the project targets `net8.0` or `net9.0` in all `.csproj` files before adding the package.

---

## Sources

### Primary (HIGH confidence)

- [FluentValidation NuGet 12.1.1](https://www.nuget.org/packages/fluentvalidation/) + [official docs](https://fluentvalidation.net/aspnet) — validation approach and manual injection guidance
- [ErrorOr NuGet 2.0.1](https://www.nuget.org/packages/erroror) — result pattern for domain error handling
- [ASP.NET Core rate limiting middleware — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit) — built-in `PartitionedRateLimiter` guidance
- [Microsoft.Extensions.Http.Resilience NuGet 8.5.0](https://www.nuget.org/packages/Microsoft.Extensions.Http.Resilience/8.5.0) + [Http.Polly deprecation — GitHub #57209](https://github.com/dotnet/aspnetcore/issues/57209)
- [Serilog.AspNetCore NuGet 10.0.0](https://www.nuget.org/packages/serilog.aspnetcore) + [Serilog.Enrichers.Sensitive NuGet 2.1.0](https://www.nuget.org/packages/Serilog.Enrichers.Sensitive)
- [Testcontainers.PostgreSql NuGet 4.11.0](https://www.nuget.org/packages/Testcontainers.PostgreSql) + [Getting Started guide](https://testcontainers.com/guides/getting-started-with-testcontainers-for-dotnet/)
- [Npgsql Basic Usage and Connection Pooling](https://www.npgsql.org/doc/basic-usage.html) — NpgsqlDataSource singleton requirement
- [Global Error Handling in ASP.NET Core 8 — Milan Jovanović](https://www.milanjovanovic.tech/blog/global-error-handling-in-aspnetcore-8) — IExceptionHandler chain pattern
- [Integration Tests in ASP.NET Core — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-8.0)
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/) — security misconfiguration, cryptographic failures
- [BenchmarkDotNet NuGet 0.15.8](https://www.nuget.org/packages/benchmarkdotnet/)
- [dotnet-reportgenerator-globaltool NuGet 5.5.4](https://www.nuget.org/packages/dotnet-reportgenerator-globaltool)

### Secondary (MEDIUM confidence)

- [Milan Jovanović — Testcontainers best practices for .NET](https://www.milanjovanovic.tech/blog/testcontainers-best-practices-dotnet-integration-testing) — test fixture patterns
- [getdefacto.com — Safe database schema migrations](https://www.getdefacto.com/article/database-schema-migrations) — expand/contract migration pattern
- [DEV Community — Migrating to new password hashing algorithm](https://dev.to/rsa/migrating-existing-code-to-a-new-password-hashing-algorithm-43n5) — in-flight code migration strategy
- [Npgsql GitHub Issue #5681](https://github.com/npgsql/npgsql/issues/5681) — DataSource pooling bypass confirmation
- [JWT Best Practices — Curity](https://curity.io/resources/learn/jwt-best-practices/) — ValidateLifetime and ClockSkew guidance

---

*Research completed: 2026-03-25*
*Ready for roadmap: yes*
