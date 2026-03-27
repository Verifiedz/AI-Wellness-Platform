# Technology Stack — Hardening Libraries

**Project:** AI Wellness Platform — Hardening Milestone
**Research Focus:** Security, error handling, performance, and testing additions for .NET 8/9 microservices
**Researched:** 2026-03-25
**Overall Confidence:** HIGH (all versions verified against NuGet.org)

---

## Context: What Already Exists

The existing stack (from `.planning/codebase/STACK.md`) already includes:

- xUnit 2.9.3, Moq 4.20.72, FluentAssertions 8.8.0, coverlet — test infrastructure is in place
- BCrypt.Net-Next 4.0.3 — password hashing is handled
- System.IdentityModel.Tokens.Jwt 8.3.0 + JwtBearer — JWT infrastructure is in place
- Serilog is NOT currently present — plain `ILogger<T>` (Microsoft.Extensions.Logging) is used

This research recommends only additive libraries that address the specific gaps in CONCERNS.md.

---

## Recommended Additions by Domain

### 1. Input Validation

**Add: FluentValidation 12.1.1**

| Package | Version | Target Projects |
|---------|---------|-----------------|
| `FluentValidation` | `12.1.1` | auth-service, chat-service |
| `FluentValidation.DependencyInjectionExtensions` | `12.1.1` | auth-service, chat-service |

**Why:** CONCERNS.md explicitly names FluentValidation as the fix approach for the "No Input Validation on String Length" vulnerability. FluentValidation 12 supports .NET 8/9, is the current major version (released December 2025), and its fluent `RuleFor` syntax keeps validation colocated with request DTOs rather than scattered across service methods.

**Why NOT `FluentValidation.AspNetCore` 11.3.1:** The maintainers themselves deprecated the auto-validation pipeline approach. It is not async-safe and intercepts model binding in ways that conflict with minimal API endpoints. Manually inject `IValidator<T>` into controllers or endpoint handlers and call `ValidateAsync()` explicitly. This is the current official recommendation.

**Confidence:** HIGH — version verified on nuget.org; official docs confirm the manual-injection approach for .NET 8+.

```csharp
// Registration (Program.cs)
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Usage in controller or endpoint
var result = await _validator.ValidateAsync(request);
if (!result.IsValid)
    return Results.ValidationProblem(result.ToDictionary());
```

---

### 2. Error Handling — Result Pattern

**Add: ErrorOr 2.0.1**

| Package | Version | Target Projects |
|---------|---------|-----------------|
| `ErrorOr` | `2.0.1` | auth-service, chat-service, AI-Wrapper-Service |

**Why:** CONCERNS.md identifies 27+ `throw new Exception()` instances across services, broad `catch (Exception ex)` returning raw messages to clients, and no domain-specific exception types. ErrorOr provides a discriminated union (`ErrorOr<T>`) that forces all call sites to explicitly handle both success and error branches at compile time. It ships built-in error types — `Error.Validation`, `Error.NotFound`, `Error.Unauthorized`, `Error.Conflict` — that map cleanly to HTTP status codes in a single middleware.

**Why NOT custom typed exceptions:** Typed exceptions (`PasswordValidationException`, etc.) are the approach named in CONCERNS.md but they require a global exception handler middleware to interpret them, still depend on exceptions for flow control (expensive stack unwinding), and do not prevent developers from accidentally catching `Exception` again. ErrorOr makes the unhappy path a value, not a control-flow mechanism.

**Why NOT OneOf:** OneOf is designed for methods returning multiple distinct types that are not exclusively success/failure. ErrorOr's built-in `Error` enum covers all domain error cases without boilerplate.

**Why NOT CSharpFunctionalExtensions:** Better suited to greenfield functional-style codebases. The `Result.Try()` wrapper approach adds indirection without improving clarity.

**Confidence:** HIGH — version 2.0.1 verified on nuget.org; authorship and community adoption verified.

```csharp
// Service method
public async Task<ErrorOr<UserDto>> LoginAsync(LoginRequest request)
{
    var user = await _repo.FindByEmailAsync(request.Email);
    if (user is null) return Error.NotFound("Auth.UserNotFound", "Invalid credentials.");
    if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        return Error.Unauthorized("Auth.InvalidPassword", "Invalid credentials.");
    return _mapper.Map<UserDto>(user);
}

// Controller
var result = await _authService.LoginAsync(request);
return result.Match(
    user => Ok(user),
    errors => errors.First().Type switch {
        ErrorType.NotFound     => NotFound(),
        ErrorType.Unauthorized => Unauthorized(),
        _                      => Problem()
    });
```

**Pair with global exception middleware** (no new package needed) to catch any unhandled exceptions and return RFC 7807 Problem Details. ASP.NET Core 8 has `IProblemDetailsService` built in.

---

### 3. Rate Limiting

**Use: ASP.NET Core 8 built-in rate limiter (no new package)**

| Component | Package | Notes |
|-----------|---------|-------|
| `Microsoft.AspNetCore.RateLimiting` | Built into ASP.NET Core 8 SDK | No NuGet install needed |

**Why:** The built-in `AddRateLimiter` / `UseRateLimiter` middleware (available since .NET 7, GA in .NET 8) supports Fixed Window, Sliding Window, Token Bucket, and Concurrency algorithms out of the box. It supports per-user and per-IP partitioning through `PartitionedRateLimiter<HttpContext>`. This directly addresses the "No rate limiting on `/api/auth/verify-email`" vulnerability in CONCERNS.md.

**Why NOT AspNetCoreRateLimit (stefanprodan):** This third-party package predates the built-in middleware and requires additional configuration infrastructure. The built-in alternative is now preferred by Microsoft's own documentation. AspNetCoreRateLimit still sees use for distributed (Redis-backed) scenarios, but the platform is single-host for a capstone project.

**Why NOT Polly rate limiter:** Polly's `RateLimiter` strategy (in `Polly.RateLimiting`) is designed for outbound client-side throttling (e.g., throttling calls to OpenAI API), not inbound request limiting on endpoints. They solve different problems.

**Confidence:** HIGH — official Microsoft docs confirm built-in middleware is the current standard for .NET 8+.

```csharp
// Program.cs
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Per-email sliding window for /auth/verify-email
    options.AddSlidingWindowLimiter("verify-email", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(15);
        opt.SegmentsPerWindow = 3;
    });

    // Global fixed window for all auth endpoints
    options.AddFixedWindowLimiter("auth-global", opt =>
    {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});

app.UseRateLimiter();

// Controller or endpoint attribute
[EnableRateLimiting("verify-email")]
[HttpPost("verify-email")]
public async Task<IActionResult> VerifyEmail(...) { ... }
```

---

### 4. Resilience for Outbound HTTP (OpenAI Client)

**Add: Microsoft.Extensions.Http.Resilience 8.5.0**

| Package | Version | Target Projects |
|---------|---------|-----------------|
| `Microsoft.Extensions.Http.Resilience` | `8.5.0` | AI-Wrapper-Service |

**Why:** CONCERNS.md flags unhandled OpenAI error scenarios (HTTP 429 rate limits, token limit exceeded, model unavailable). This package wraps `HttpClient` with a Polly v8 resilience pipeline (retry with exponential backoff + jitter, circuit breaker, timeout) through a single `AddStandardResilienceHandler()` call. It replaces the now-deprecated `Microsoft.Extensions.Http.Polly`.

**Why NOT raw Polly.Core:** The `Microsoft.Extensions.Http.Resilience` package already expresses the five-strategy standard pipeline in two lines of configuration. Raw Polly requires manually composing the same strategies. For this use case — outbound HTTP to one API — the standard handler is sufficient.

**Why NOT `Microsoft.Extensions.Http.Polly`:** Officially deprecated as of 2025. Its replacement is `Microsoft.Extensions.Http.Resilience`.

**Confidence:** HIGH — deprecation confirmed via GitHub issue dotnet/aspnetcore#57209; version 8.5.0 verified on nuget.org.

```csharp
// AI-Wrapper-Service Program.cs
builder.Services.AddHttpClient<IOpenAIChatService, OpenAIChatService>(client =>
{
    client.BaseAddress = new Uri("https://api.openai.com");
    // Do NOT set Authorization in DefaultRequestHeaders — inject per-request instead
})
.AddStandardResilienceHandler(options =>
{
    options.Retry.MaxRetryAttempts = 3;
    options.Retry.Delay = TimeSpan.FromSeconds(1);
    options.CircuitBreaker.FailureRatio = 0.5;
    options.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(30);
});
```

---

### 5. Structured Logging with PII Masking

**Add: Serilog.AspNetCore 10.0.0 + Serilog.Enrichers.Sensitive 2.1.0**

| Package | Version | Target Projects |
|---------|---------|-----------------|
| `Serilog` (core, pulled transitively) | `4.3.1` | auth-service, chat-service |
| `Serilog.AspNetCore` | `10.0.0` | auth-service, chat-service |
| `Serilog.Enrichers.Sensitive` | `2.1.0` | auth-service |
| `Serilog.Sinks.Console` | latest stable | all services |

**Why Serilog over Microsoft.Extensions.Logging alone:** CONCERNS.md identifies emails logged in plain text across 9+ call sites in `AuthService.cs` and a 2FA code potentially logged at line 125. The existing `ILogger<T>` interface has no redaction mechanism. Serilog's `Enrichers.Sensitive` package intercepts structured log properties and applies regex-based masking before the event reaches any sink. Serilog 4.x also auto-captures `TraceId`/`SpanId` from `Activity.Current` with no extra enricher package.

**Why Serilog.Enrichers.Sensitive specifically:** It supports property-name-based masking (mask any property named `"Email"` or `"Code"` globally), scoped sensitive areas, and is the community-standard approach (16.5M+ downloads). It directly solves the CONCERNS.md finding without rewriting every log call site.

**Why NOT Microsoft.Extensions.Logging.Redaction (.NET 8 built-in):** The built-in redaction API (via `IRedactorProvider`) requires .NET 8 SDK and is less mature in ASP.NET Core hosting integration than Serilog's ecosystem. It is a viable alternative but requires more configuration boilerplate for property-level masking.

**Confidence:** HIGH — versions verified on nuget.org; Serilog.AspNetCore major version tracks .NET major version (v10 = .NET 10 compat, also works on .NET 8/9 targets).

**Note on version alignment:** Serilog.AspNetCore 10.0.0 targets .NET 8+ and is the latest stable release (November 2025). Use it for .NET 8 or 9 projects — the major version tracks `Microsoft.Extensions.Hosting`, not the runtime version.

```csharp
// Program.cs
builder.Host.UseSerilog((ctx, lc) => lc
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.WithSensitiveDataMasking(opts =>
    {
        opts.MaskProperties.Add(MaskProperty.WithDefaults("Email"));
        opts.MaskProperties.Add(MaskProperty.WithDefaults("Code"));
        opts.MaskProperties.Add(MaskProperty.WithDefaults("VerificationCode"));
    })
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {TraceId} {Message:lj}{NewLine}{Exception}"));
```

---

### 6. Integration Testing — Real Infrastructure

**Add: Testcontainers.PostgreSql 4.11.0 + Testcontainers.Redis 4.10.0**

| Package | Version | Target Projects |
|---------|---------|-----------------|
| `Testcontainers.PostgreSql` | `4.11.0` | auth-service.Tests, chat-service.Tests |
| `Testcontainers.Redis` | `4.10.0` | chat-service.Tests |

**Why:** Three of the four test coverage gaps in CONCERNS.md require real database behavior to verify correctly: session authorization boundary (requires a real PostgreSQL instance to test cross-user session access), password reset token expiry (requires real time-based record expiry), and connection pool exhaustion. Mocking `IRepository` does not catch SQL-level authorization bugs. Testcontainers spins up a real PostgreSQL container per test class, isolated and ephemeral. Docker is a standard CI dependency.

**Why NOT SQLite in-memory:** SQLite does not support PostgreSQL-specific features (JSONB columns, stored procedures used by the chat service, Npgsql-specific data types). The existing codebase uses stored procedures — an in-memory DB would require a completely different data access path in tests.

**Why NOT a shared dev database:** Shared state between tests causes flaky tests and makes parallel CI runs impossible.

**Confidence:** HIGH — versions 4.11.0 and 4.10.0 verified on nuget.org; PostgreSQL module usage with .NET 8 confirmed in official Testcontainers docs.

```csharp
// Test fixture (IAsyncLifetime for xUnit)
public class ChatIntegrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        // Run migrations against _postgres.GetConnectionString()
    }

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();
}
```

---

### 7. Coverage Reporting (Enhance Existing)

**Add: ReportGenerator 5.5.4 (global tool)**

| Component | Version | Install Type |
|-----------|---------|--------------|
| `dotnet-reportgenerator-globaltool` | `5.5.4` | `dotnet tool install -g` |

**Why:** coverlet is already present in the project and generates `coverage.cobertura.xml`. ReportGenerator converts that XML into an HTML report with line/branch coverage visualized per file. This is a development-time tool, not a runtime dependency. It surfaces the coverage gaps identified in CONCERNS.md as measurable percentages.

**Confidence:** HIGH — version 5.5.4 verified on nuget.org.

```bash
dotnet tool install --global dotnet-reportgenerator-globaltool --version 5.5.4

# After test run:
dotnet test --collect:"XPlat Code Coverage"
reportgenerator \
  -reports:"**/TestResults/**/coverage.cobertura.xml" \
  -targetdir:"coverage" \
  -reporttypes:Html
```

---

### 8. Microbenchmarking (Performance Work)

**Add: BenchmarkDotNet 0.15.8 (to a dedicated benchmark project)**

| Package | Version | Target Projects |
|---------|---------|-----------------|
| `BenchmarkDotNet` | `0.15.8` | \*.Benchmarks (new project, not production) |

**Why:** CONCERNS.md identifies chat history deserialization on every request as a concrete performance bottleneck. Once the fix (switching to JSONB structured storage) is implemented, a BenchmarkDotNet microbenchmark can prove the improvement quantitatively. Do NOT add BenchmarkDotNet to production assemblies — it should be in an isolated `.Benchmarks` project to prevent benchmark scaffolding from loading in production.

**Why NOT dotTrace/dotMemory as a NuGet dependency:** dotTrace and dotMemory are profiler tools (JetBrains Rider / standalone), not NuGet packages needed in the codebase. They attach externally. BenchmarkDotNet is the NuGet package needed to write reproducible benchmarks.

**Confidence:** HIGH — version 0.15.8 verified on nuget.org (released November 2025).

---

## Do NOT Add

| Package | Reason to Avoid |
|---------|-----------------|
| `FluentValidation.AspNetCore` | Deprecated auto-validation pipeline; not async-safe; maintainers recommend against it for .NET 8+ |
| `Microsoft.Extensions.Http.Polly` | Officially deprecated in 2025; replaced by `Microsoft.Extensions.Http.Resilience` |
| `AspNetCoreRateLimit` (stefanprodan) | Superseded by ASP.NET Core 8 built-in middleware for single-host deployments |
| `MediatR` | Adds indirection without benefit for a codebase of this size; overkill for the error handling refactor |
| `AutoMapper` | Not needed; the hardening scope has no DTO mapping expansion |
| `OneOf` | Correct for multi-type returns, not for the binary success/error pattern this codebase needs |
| `CSharpFunctionalExtensions` | Better for functional-paradigm rewrites; adds migration complexity for a hardening-only scope |

---

## Installation Summary

```bash
# --- auth-service ---
dotnet add package FluentValidation --version 12.1.1
dotnet add package FluentValidation.DependencyInjectionExtensions --version 12.1.1
dotnet add package ErrorOr --version 2.0.1
dotnet add package Serilog.AspNetCore --version 10.0.0
dotnet add package Serilog.Enrichers.Sensitive --version 2.1.0
dotnet add package Serilog.Sinks.Console

# --- chat-service ---
dotnet add package FluentValidation --version 12.1.1
dotnet add package FluentValidation.DependencyInjectionExtensions --version 12.1.1
dotnet add package ErrorOr --version 2.0.1
dotnet add package Serilog.AspNetCore --version 10.0.0
dotnet add package Serilog.Sinks.Console

# --- AI-Wrapper-Service ---
dotnet add package ErrorOr --version 2.0.1
dotnet add package Microsoft.Extensions.Http.Resilience --version 8.5.0

# --- auth-service.Tests / chat-service.Tests ---
dotnet add package Testcontainers.PostgreSql --version 4.11.0
dotnet add package Testcontainers.Redis --version 4.10.0  # chat-service only

# --- Global tool (run once per developer machine) ---
dotnet tool install --global dotnet-reportgenerator-globaltool --version 5.5.4

# --- New *.Benchmarks project only ---
dotnet add package BenchmarkDotNet --version 0.15.8
```

---

## Confidence Assessment

| Area | Confidence | Evidence |
|------|------------|----------|
| FluentValidation 12.1.1 | HIGH | Verified on nuget.org; official docs confirm manual-injection approach for .NET 8+ |
| ErrorOr 2.0.1 | HIGH | Verified on nuget.org; authorship confirmed |
| Built-in rate limiter (no package) | HIGH | Official Microsoft docs; no NuGet needed |
| Microsoft.Extensions.Http.Resilience 8.5.0 | HIGH | Verified on nuget.org; `Http.Polly` deprecation confirmed via GitHub issue |
| Serilog.AspNetCore 10.0.0 | HIGH | Verified on nuget.org; 656M+ downloads; November 2025 release |
| Serilog.Enrichers.Sensitive 2.1.0 | HIGH | Verified on nuget.org; 16.5M+ downloads |
| Testcontainers 4.11.0 / 4.10.0 | HIGH | Verified on nuget.org; official Testcontainers .NET docs |
| ReportGenerator 5.5.4 | HIGH | Verified on nuget.org |
| BenchmarkDotNet 0.15.8 | HIGH | Verified on nuget.org; November 2025 release |

---

## Sources

- [FluentValidation NuGet 12.1.1](https://www.nuget.org/packages/fluentvalidation/)
- [FluentValidation.DependencyInjectionExtensions](https://www.nuget.org/packages/fluentvalidation.dependencyinjectionextensions/)
- [FluentValidation official docs — ASP.NET Core integration](https://fluentvalidation.net/aspnet)
- [ErrorOr NuGet 2.0.1](https://www.nuget.org/packages/erroror)
- [ASP.NET Core rate limiting middleware — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0)
- [Microsoft.Extensions.Http.Resilience NuGet 8.5.0](https://www.nuget.org/packages/Microsoft.Extensions.Http.Resilience/8.5.0)
- [Microsoft.Extensions.Http.Polly deprecation — GitHub issue #57209](https://github.com/dotnet/aspnetcore/issues/57209)
- [Building resilient cloud services with .NET 8 — .NET Blog](https://devblogs.microsoft.com/dotnet/building-resilient-cloud-services-with-dotnet-8/)
- [Serilog.AspNetCore NuGet 10.0.0](https://www.nuget.org/packages/serilog.aspnetcore)
- [Serilog.Enrichers.Sensitive NuGet 2.1.0](https://www.nuget.org/packages/Serilog.Enrichers.Sensitive)
- [Serilog.Enrichers.Sensitive GitHub](https://github.com/serilog-contrib/Serilog.Enrichers.Sensitive)
- [Testcontainers.PostgreSql NuGet 4.11.0](https://www.nuget.org/packages/Testcontainers.PostgreSql)
- [Testcontainers.Redis NuGet 4.10.0](https://www.nuget.org/packages/Testcontainers.Redis)
- [Testcontainers for .NET — Getting Started](https://testcontainers.com/guides/getting-started-with-testcontainers-for-dotnet/)
- [dotnet-reportgenerator-globaltool NuGet 5.5.4](https://www.nuget.org/packages/dotnet-reportgenerator-globaltool)
- [BenchmarkDotNet NuGet 0.15.8](https://www.nuget.org/packages/benchmarkdotnet/)
- [coverlet — Code Coverage for .NET](https://github.com/coverlet-coverage/coverlet)
- [Polly v8 docs — pollydocs.org](https://www.pollydocs.org/)
