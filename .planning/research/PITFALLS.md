# Domain Pitfalls: .NET Microservices Hardening

**Domain:** Retrofitting security, error handling, and performance improvements into existing .NET microservices
**Project:** AI Wellness Platform — Auth Service, Chat Service, AI Wrapper Service
**Researched:** 2026-03-25
**Overall confidence:** HIGH (verified against official .NET docs, Npgsql docs, OWASP 2025, and confirmed against actual CONCERNS.md)

---

## Critical Pitfalls

Mistakes that cause rewrites, regressions, or new vulnerabilities.

---

### Pitfall 1: Breaking the API Contract When Refactoring Exception Handling

**What goes wrong:**
The existing codebase throws generic `Exception` types everywhere (27 instances in auth-service alone). Replacing these with typed domain exceptions (`PasswordValidationException`, `SessionAccessDeniedException`, etc.) and mapping them through a global middleware handler inevitably changes the HTTP status codes and error response shape that clients already depend on.

The React Native frontend parses error responses today. If the HTTP status code for "wrong password" changes from 500 to 401, or the JSON body shape changes from `{ "message": "..." }` to RFC 7807 `ProblemDetails` (`{ "type": ..., "title": ..., "status": ..., "detail": ... }`), the frontend will silently mishandle the error or show the wrong UI state.

**Why it happens:**
Developers focus entirely on the server-side refactor and assume the frontend just reads `.message`. They don't audit what shape the frontend actually deserializes, and there are no contract tests to catch the mismatch.

**Consequences:**
- Login errors show blank screens instead of user-friendly messages
- Frontend error boundaries fire unexpectedly
- 2FA and password reset flows break silently (the most sensitive user flows)

**Warning signs:**
- `chatApi.js` or auth API calls that do `error.response.data.message` or `.error` or similar ad-hoc field access
- No snapshot or contract tests for API error responses
- Frontend handles errors only in `catch` blocks with generic fallbacks

**Prevention:**
1. Before touching any exception handling, audit every place the frontend reads error responses (`frontend/src/services/chatApi.js` and auth equivalents). Document the current de-facto contract.
2. Adopt RFC 7807 `ProblemDetails` as the new standard shape. ASP.NET Core 8 has built-in support via `AddProblemDetails()`.
3. Implement the global exception handler middleware first, deploy it as a passthrough (no behavior change), then migrate exceptions one at a time.
4. Update the frontend to use the new ProblemDetails shape in the same PR as the first service that emits it. Do not let them drift.
5. Write golden-file response tests for every error path before refactoring.

**Phase:** Address in the "Error Handling Refactor" phase. Must be the first item, before any other service changes.

---

### Pitfall 2: Hashing Verification Codes Without a Migration Path for Existing Codes

**What goes wrong:**
The codebase stores email verification and 2FA codes in plaintext in the `verificationcodes` table. The fix — hashing codes with bcrypt or HMACSHA256 before storage — is straightforward for new codes. The pitfall is what happens to codes that were generated before the deployment but are submitted after it.

During the deployment window, a user may have received a verification email. After the service restarts with hashing enabled, their code comparison fails because the stored value is plaintext but the lookup now hashes the input before comparing. This produces silent verification failures for users already mid-flow.

**Why it happens:**
The fix is written with no awareness that the `verificationcodes` table may have live rows at deploy time. This is especially risky for a short-TTL table (5 minutes for 2FA, unknown TTL for email codes) — developers assume "the codes expire fast anyway" without accounting for the deployment moment itself.

**Consequences:**
- Users locked out of verification mid-flow during deployment
- For email codes with unspecified TTL, codes could be in the table for hours
- Debugging is hard because the logs show "code mismatch" with no clear reason

**Warning signs:**
- No migration script that pre-hashes existing rows before the code change deploys
- No TTL column on `verificationcodes` — meaning rows may live indefinitely
- Tests only cover the happy path with freshly generated codes

**Prevention:**
1. Add a `created_at` column and explicit TTL to `verificationcodes` as a separate migration, first.
2. Write a data migration that expires (deletes) any existing codes older than 5 minutes at deploy time — this eliminates the plaintext-in-flight problem.
3. The code comparison logic must handle two states during a rolling deploy: check if the stored value looks like a hash (starts with `$2` for bcrypt); if not, reject and force re-generation. Do not try to compare plaintext against hash.
4. Prefer HMACSHA256 (keyed hash) over bcrypt for short-lived codes — bcrypt's work factor is unnecessary overhead for 5-minute codes and adds latency to verification endpoints.
5. Use `RandomNumberGenerator.GetBytes()` (already used in `JwtService.cs`) for code generation — the pattern exists in the codebase, replicate it.

**Phase:** Security phase, before any other security fixes. The TTL migration should be a prerequisite step.

---

### Pitfall 3: JWT ValidateLifetime Already Defaults to True — But Misconfiguration Resets It

**What goes wrong:**
The CONCERNS.md identifies JWT expiry enforcement as a known bug. The actual risk is more subtle: `ValidateLifetime` defaults to `true` in `TokenValidationParameters`. The real failure mode is that somewhere in `Program.cs` the token validation parameters are manually constructed, and a copy-paste or "simplified" example sets `ValidateLifetime = false`, or clock skew is set to `TimeSpan.MaxValue` to "fix" test environment clock drift.

The consequence is that expired tokens continue working in production, which is particularly dangerous because these tokens carry role and identity claims for access to chat history and session data — personal wellness data.

**Why it happens:**
Developers debugging JWT validation failures in a CI environment (where clocks drift) temporarily disable lifetime validation. The configuration change ships to production.

**Consequences:**
- Expired tokens grant persistent access to user data
- Logout/token revocation becomes meaningless
- If tokens are ever intercepted, the attack window is unlimited rather than 60 minutes

**Warning signs:**
- `ClockSkew` set to anything greater than 5 minutes in `TokenValidationParameters`
- `ValidateLifetime = false` anywhere in the codebase
- No integration test that presents an expired token and asserts a 401 response

**Prevention:**
1. Search the entire codebase for `ValidateLifetime` and `ClockSkew` before making any JWT changes. Confirm the current state.
2. Add an integration test: generate a token, advance the clock past expiry (use `TimeProvider` in .NET 8), call a protected endpoint, assert 401.
3. Set `ClockSkew = TimeSpan.FromMinutes(1)` as the maximum acceptable value. Document why.
4. The YARP gateway layer should also validate lifetime — do not rely solely on downstream services.

**Phase:** Security phase. This is a verification fix, not a new feature. Low implementation risk if done carefully.

---

### Pitfall 4: PostgreSQL Schema Migration Locks Under Load (Adding Columns to Live Tables)

**What goes wrong:**
The hardening work requires adding columns to live tables: a `role` column to the chat messages table, a `created_at`/TTL column to `verificationcodes`, and possibly a `version` field for hashing schemes. `ALTER TABLE ADD COLUMN` in PostgreSQL acquires an `AccessExclusiveLock`. On a table with active queries, this lock will wait behind running transactions — and every subsequent query on that table will queue behind the migration. On a small capstone project this is low risk, but the pattern of "run migrations at startup" (`DbUp`/`FluentMigrator` auto-run) combined with connection pool contention makes this a real failure mode.

**Why it happens:**
Developers run migrations as part of application startup (`app.Migrate()` or similar). The migration acquires a table lock while the application is also trying to serve requests from the same pool.

**Consequences:**
- Application appears to hang at startup under any concurrent traffic
- Connection pool exhaustion if the lock wait exceeds the pool timeout
- Data loss risk if the migration script is not idempotent and is re-run after a crash

**Warning signs:**
- Migrations executed via startup code rather than a separate migration step
- Migration scripts lack `IF NOT EXISTS` guards
- No `BEGIN`/`COMMIT` transaction wrapping in migration scripts
- No test of the migration against a populated database (only against empty schema)

**Prevention:**
1. Run migrations as a separate startup step before the application starts serving traffic. In Docker Compose terms: a migration init-container or a `dotnet ef database update` step before `dotnet run`.
2. All `ALTER TABLE ADD COLUMN` statements must add nullable columns only. Populate defaults in a subsequent UPDATE, then add NOT NULL constraint last (three separate steps: expand, populate, contract).
3. Every migration script must be idempotent: `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, etc.
4. Test migrations against a Testcontainers PostgreSQL instance with pre-existing data before merging.
5. For the `verificationcodes` table specifically: truncate before adding NOT NULL columns — the table is transient and should be empty at deploy time after the expiry cleanup migration runs first.

**Phase:** Any phase that touches the database schema. Must be the first task in each such phase.

---

### Pitfall 5: NpgsqlDataSource Recreated Per-Request Bypasses the Connection Pool

**What goes wrong:**
`ChatDatabaseProvider.cs` already mixes `_dataSource.OpenConnectionAsync()` (correct, line 91) with direct `new NpgsqlConnection(connectionString)` instantiation (lines 32, 52, 64 — the bug identified in CONCERNS.md). The fix — replacing all direct instantiation with `_dataSource.OpenConnectionAsync()` — is correct. The trap is the inverse: developers sometimes "fix" the inconsistency by pulling the connection string out and building a new `NpgsqlDataSource` per method call instead of per-application lifetime.

If `NpgsqlDataSource` is built with `=>` (expression body) instead of `=` (assigned field), a new pool is created on every access. Every connection becomes a fresh physical TCP connection to PostgreSQL. Under load this hits PostgreSQL's `max_connections` limit quickly.

**Why it happens:**
The Npgsql docs clearly say one datasource = one pool, but the distinction between a singleton datasource and a recreated one is invisible in code that "works" at low concurrency. The bug only surfaces under load.

**Consequences:**
- `"53300: FATAL: remaining connection slots are reserved"` PostgreSQL errors under concurrent chat requests
- Connection leaks because un-pooled connections are never returned
- Resource exhaustion on the PostgreSQL server

**Warning signs:**
- `NpgsqlDataSource.Create(...)` called inside a method rather than in `Program.cs` DI registration
- Provider classes using `new NpgsqlDataSource(...)` in constructors or fields that are not singleton-scoped
- No explicit `MaxPoolSize` configuration in the datasource builder

**Prevention:**
1. Register `NpgsqlDataSource` exactly once in `Program.cs` using `builder.Services.AddNpgsqlDataSource(connectionString, builder => builder.MaxPoolSize(20))`. Inject `NpgsqlDataSource` via DI into all providers.
2. Remove all direct `new NpgsqlConnection(...)` calls. Replace with `await _dataSource.OpenConnectionAsync()`.
3. Verify with `dataSource.Statistics` in a test that connection count stays bounded under concurrent load.
4. All connections must be inside `await using` blocks — connection leaks are silent and accumulate.

**Phase:** Tech debt phase (connection management). This is a prerequisite before load-testing anything else.

---

## Moderate Pitfalls

Mistakes that cause bugs or degraded quality, but are recoverable without a rewrite.

---

### Pitfall 6: FluentValidation Auto-Validation Is Deprecated and Breaks Async Rules

**What goes wrong:**
Adding input validation to `SessionService.cs` and `chatService.cs` via the `FluentValidation.AspNetCore` NuGet package and calling `AddFluentValidationAutoValidation()` is a common approach. This package has been **deprecated** as of FluentValidation 11+. Auto-validation also cannot run async validators, and if an async rule is added later (e.g., a database uniqueness check), it throws `AsyncValidatorInvokedSynchronouslyException` at runtime, not compile time.

**Warning signs:**
- `FluentValidation.AspNetCore` in the `.csproj` file
- `AddFluentValidationAutoValidation()` in `Program.cs`
- Any validator that calls `MustAsync`

**Prevention:**
Use manual validation: inject `IValidator<T>` into the service or controller and call `await validator.ValidateAsync(model)` explicitly. Use `FluentValidation` and `FluentValidation.DependencyInjectionExtensions` packages only (not the `.AspNetCore` package). Register validators with `builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly())`.

**Phase:** Tech debt / input validation phase.

---

### Pitfall 7: Rate Limiting Middleware Order Silently Breaks Authorization

**What goes wrong:**
Adding `UseRateLimiter()` to the middleware pipeline in the wrong position can cause rate limiting to fire before authentication resolves the user identity. This makes per-user rate limiting impossible (all requests appear as anonymous) and can cause the `[Authorize]` middleware to run on requests that should have already been rejected.

The correct order is: `UseRouting` → `UseAuthentication` → `UseAuthorization` → `UseRateLimiter`. Inserting `UseRateLimiter` before `UseAuthentication` means rate limit partitioning by user ID will use null/anonymous as the partition key, treating all unauthenticated brute-force attempts as a single bucket rather than per-user buckets.

**Warning signs:**
- Rate limiting applied per-IP only, even for authenticated endpoints
- `HttpContext.User.Identity.IsAuthenticated` returns false inside the rate limiter's `partitionKey` lambda
- 429 responses returned for requests that should have gotten 401 first

**Prevention:**
1. Verify middleware order in `Program.cs` matches: routing → authentication → authorization → rate limiting.
2. For the email verification brute-force fix specifically, partition by email address extracted from the request body, not by user ID — the user is not authenticated at that point.
3. Write a middleware-order integration test using `WebApplicationFactory` that exercises rate limit behavior on authenticated vs unauthenticated routes.

**Phase:** Security phase (brute-force protection).

---

### Pitfall 8: Test Brittleness When Testing Across the Auth/Chat Service Boundary

**What goes wrong:**
The session authorization boundary test (User A accessing User B's sessions) and the role assignment test both require a real JWT to be present in the request. Tests that generate JWTs inline using hardcoded secrets diverge from the actual `JwtService.cs` configuration. When `JwtService.cs` changes its signing key source (e.g., moves from appsettings to environment variable), all tests that generate tokens with the old hardcoded secret pass locally but fail in CI.

**Warning signs:**
- `new JwtSecurityTokenHandler()` called directly in test setup
- Hardcoded `"test-secret"` or similar strings in test files
- Tests that pass in isolation but fail when run after other tests (shared state in static JWT validators)

**Prevention:**
1. Create a `TestAuthHelper` that uses the actual `JwtService` class from the application under test, configured with the same test-environment keys via `WebApplicationFactory.ConfigureWebHost`.
2. Use `Testcontainers.PostgreSql` for the session authorization boundary test — this test must hit a real database to verify the `WHERE userId = @userId` clause actually enforces the boundary.
3. Tests should never construct JWTs manually. They should call the application's own auth endpoint and use the returned token.

**Phase:** Test coverage phase. Applicable to all cross-boundary tests.

---

### Pitfall 9: OpenAI API Key Persisting in HttpClient Default Headers Leaks to Logs

**What goes wrong:**
`OpenAIChatService.cs` stores the OpenAI API key in `HttpClient.DefaultRequestHeaders`. The fix described in CONCERNS.md is to move to per-request header injection. The pitfall is that ASP.NET Core's built-in HTTP client logging middleware (`AddHttpClient` with default logging) logs request headers at `Debug` level. If someone enables `Debug` log level to troubleshoot OpenAI issues, the API key appears in logs in plaintext.

Even after moving to per-request injection, if the application uses `IHttpClientFactory` with a named client, Polly retry policies will re-attach the header — but if the key is per-request, it must be passed through the retry context explicitly, or the retry attempt will have no auth header.

**Warning signs:**
- `DefaultRequestHeaders.Add("Authorization", ...)` anywhere in service constructors
- `builder.Services.AddHttpClient()` without `RedactLoggedRequestHeaders` configuration
- Polly retry policies on the OpenAI client that don't explicitly handle auth header re-attachment

**Prevention:**
1. Move to per-request header injection using `HttpRequestMessage` constructed per call.
2. Configure `AddHttpClient("openai").RedactLoggedRequestHeaders(["Authorization"])` in `Program.cs`.
3. Test the retry behavior: mock a 429 response, verify the retry attempt includes the Authorization header.
4. Consider `IHttpClientFactory` with a delegating handler that adds the key from `IOptions<OpenAISettings>` — this keeps the key in one place and out of service constructors.

**Phase:** Security phase (API key management).

---

### Pitfall 10: Chat History Role Fix Breaks Existing Session Data

**What goes wrong:**
The fix for chat role assignment is to store the `role` field in the database rather than inferring it from array index. This requires: (1) a new `role` column on the chat messages table, (2) populating `role` on insert, (3) reading `role` on retrieval. But existing rows in the database have no `role` value. When the migration adds a nullable `role` column, old rows return `null`, and the frontend (which previously used index-based heuristics) now receives `null` roles and likely renders nothing or crashes.

**Why it happens:**
The migration adds the column but has no backfill strategy for existing rows. The code is updated to read `role` from the column, but there is no fallback for null.

**Consequences:**
- Existing chat history displays broken or empty for all users
- The index-based heuristic fallback in `chatApi.js` is removed too early

**Warning signs:**
- Migration script has no `UPDATE` statement to backfill existing rows
- Frontend removes the index-based fallback in the same PR as the backend change
- No integration test that creates a session with the old schema and verifies it reads correctly after migration

**Prevention:**
1. The migration must backfill: `UPDATE chat SET role = CASE WHEN (ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at)) % 2 = 1 THEN 'user' ELSE 'assistant' END`. This applies the same heuristic retrospectively — imperfect, but no worse than current behavior.
2. The backend must handle `null` role values after migration by falling back to the index heuristic during a transition window.
3. Remove the index-based fallback from `chatApi.js` only after confirming all rows in the database have non-null roles (one week after migration at minimum).
4. Add a test fixture with pre-migration data loaded into Testcontainers and verify it reads correctly post-migration.

**Phase:** Known bugs phase (role assignment fix).

---

## Minor Pitfalls

Mistakes that cause noise, inconsistency, or technical debt accumulation.

---

### Pitfall 11: Structured Logging Redaction That Misses Dynamic String Interpolation

**What goes wrong:**
Adding log masking via Serilog destructuring policies or `ILogger` redaction filters catches `logger.LogInformation("User {Email} logged in", email)` but misses `logger.LogInformation($"User {email} logged in")` (string interpolation). Interpolated strings are evaluated before the logger sees them — the redaction filter never gets the email as a separate parameter, it receives the entire pre-formatted string.

**Prevention:**
Audit all log calls. Any line using string interpolation (`$"..."`) with PII must be converted to structured logging with named parameters (`{Email}`) before adding redaction filters. A Roslyn analyzer or a grep for `LogInformation($` can catch these.

**Phase:** Security phase (log masking).

---

### Pitfall 12: Stored Procedure Name Constants Without Database Existence Validation

**What goes wrong:**
Replacing the hardcoded string dictionaries in `SessionDatabaseProvider.cs` and `ChatDatabaseProvider.cs` with C# constants (`const string GetSessionById = "sp_get_session_by_id"`) eliminates typo risk at call sites, but the constant can still point to a procedure that does not exist in the database. A typo in the procedure name in the SQL migration script (creating the actual procedure) produces a runtime error at first call, not at startup.

**Prevention:**
Add a startup health check that executes `SELECT proname FROM pg_proc WHERE proname = @procName` for each procedure constant. If any procedure is missing, the application fails fast with a clear error on startup. This can be implemented as a `IHealthCheck` with `services.AddHealthChecks().AddCheck<StoredProcedureHealthCheck>()`.

**Phase:** Tech debt phase (stored procedure names).

---

### Pitfall 13: Enum Rename of `dummy1` Breaks Existing Database Rows

**What goes wrong:**
`enums.Status.dummy1` is used to mark messages in the database. Renaming or removing `dummy1` from the enum means existing rows that have the string/int value of `dummy1` stored will fail to deserialize when read back. If the enum is stored as an integer, the mapping can silently shift. If stored as a string, a Dapper mapping exception will be thrown on read.

**Prevention:**
1. Check how the enum is stored in PostgreSQL (integer or string).
2. If integer: add new values without changing existing ordinals. Keep `dummy1 = 0` as a deprecated value, add `Delivered = 1`, `Error = 2`, etc.
3. Write a migration that converts all existing `dummy1` rows to `Delivered`.
4. Only then can `dummy1` be removed from the enum.

**Phase:** Tech debt phase (placeholder enums).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Global exception handler middleware | Breaking API contract (Pitfall 1) | Audit frontend error handling first; ship ProblemDetails with backward-compat wrapper |
| Verification code hashing | Mid-deploy verification failures (Pitfall 2) | Add TTL migration before hashing migration; handle plaintext-in-flight |
| JWT expiry enforcement | Accidentally disabling `ValidateLifetime` (Pitfall 3) | Integration test with expired token before and after change |
| Any schema change | PostgreSQL table lock causing startup hang (Pitfall 4) | Separate migration step; nullable columns only; idempotent scripts |
| Connection pool fix | Recreating NpgsqlDataSource defeating pooling (Pitfall 5) | Singleton registration in DI; integration test with concurrent load |
| Input validation (FluentValidation) | Deprecated auto-validation package (Pitfall 6) | Manual validation only; do not use `FluentValidation.AspNetCore` |
| Rate limiting implementation | Wrong middleware order (Pitfall 7) | Explicit order test; partition by email not user ID on auth endpoints |
| Session authorization tests | Brittle JWT construction in tests (Pitfall 8) | Use `TestAuthHelper` wrapping real `JwtService`; Testcontainers for DB |
| OpenAI key management | Key leaking into HTTP debug logs (Pitfall 9) | `RedactLoggedRequestHeaders`; per-request header injection |
| Chat role assignment fix | Null roles breaking existing session history (Pitfall 10) | Backfill migration; staged removal of frontend fallback |
| Log masking | String interpolation bypassing redaction (Pitfall 11) | Grep for `$"` in log calls; convert to structured params |
| Status enum refactor | Enum rename shifting integer ordinals (Pitfall 13) | Keep `dummy1=0`; migrate rows; remove last |

---

## Sources

- [Microsoft — Creating, evolving, and versioning microservice APIs](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/maintain-microservice-apis) — HIGH confidence
- [Npgsql — Connection Pooling, NpgsqlDataSource singleton requirement](https://www.npgsql.org/doc/basic-usage.html) — HIGH confidence
- [Npgsql GitHub Issue #5681 — DataSource pooling bypass bug](https://github.com/npgsql/npgsql/issues/5681) — HIGH confidence
- [FluentValidation — ASP.NET Core integration deprecation](https://fluentvalidation.net/aspnet) — HIGH confidence
- [OWASP Top 10:2025 — Security Misconfiguration, Broken Access Control, Cryptographic Failures](https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/) — HIGH confidence
- [Auth0 — JWT validation in .NET, ValidateLifetime](https://auth0.com/blog/how-to-validate-jwt-dotnet/) — HIGH confidence
- [getdefacto.com — Safe database schema migrations, expand/contract pattern](https://www.getdefacto.com/article/database-schema-migrations) — MEDIUM confidence
- [Milan Jovanovic — Testcontainers best practices for .NET](https://www.milanjovanovic.tech/blog/testcontainers-best-practices-dotnet-integration-testing) — MEDIUM confidence
- [DEV Community — Migrating to new password hashing algorithm](https://dev.to/rsa/migrating-existing-code-to-a-new-password-hashing-algorithm-43n5) — MEDIUM confidence
- [Microsoft Learn — Rate limiting middleware in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0) — HIGH confidence
- [Microsoft Learn — Distributed caching in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed?view=aspnetcore-9.0) — HIGH confidence
- [JWT Best Practices — APIsec, Curity](https://curity.io/resources/learn/jwt-best-practices/) — MEDIUM confidence
