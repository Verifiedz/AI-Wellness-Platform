# Feature Landscape: Security Hardening for Production .NET + React Native Mental Health App

**Domain:** Codebase hardening — mental wellness mobile app (AI chat, journaling, community)
**Stack in scope:** ASP.NET Core 8/9 microservices + React Native/Expo frontend
**Researched:** 2026-03-29
**Confidence:** HIGH (grounded in OWASP, Microsoft Learn, HIPAA guidance, and React Native official docs)

---

## Framing: What "Hardening Features" Means Here

This milestone is not adding new product features. It is closing the gap between "it works in a demo" and "it is safe and reliable for real users." The categories below represent hardening practices that auditors, security reviewers, and users of mental health apps will expect — or that the existing CONCERNS.md audit has already flagged as broken.

Mental health apps occupy a special threat tier: they process conversations about depression, crisis states, and personal trauma. A breach or misuse is not just a GDPR fine; it is reputational and human harm. This elevates several "moderate" security practices (like PII in logs) to critical status in this domain.

---

## Table Stakes

Features users, auditors, and regulators will flag if missing. "Table stakes" in hardening means: if these are broken or absent, the product is not production-ready. All items in this category correspond to confirmed issues in CONCERNS.md unless marked (NEW).

### 1. Cryptographically Secure Verification Codes
**Why expected:** Using `new Random()` for 2FA codes, password reset codes, and email verification tokens is a textbook vulnerability. Any security reviewer will catch it immediately. OWASP requires CSPRNG for all security-sensitive token generation.
**Complexity:** Low — single-method replacement (`RandomNumberGenerator.GetInt32`)
**Dependency:** None. Standalone fix in `AuthService.GenerateRandomCode()`.

### 2. 2FA Codes Not Logged in Plaintext
**Why expected:** Logging a one-time passcode at INFO level completely defeats multi-factor authentication. Any attacker with log access (shared hosting, a leaked log file, a third-party log aggregator) can harvest codes. This is a P0 security failure — it is worse than not having 2FA at all.
**Complexity:** Low — remove one log statement in `AuthService.cs` line 125.
**Dependency:** None. Standalone.

### 3. Authentication Middleware on All Services
**Why expected:** An authenticated system where one of its six services accepts unauthenticated requests is not an authenticated system. The community service reading a raw, forgeable `X-User-Id` header means any actor who knows the port number can impersonate any user. Every production microservice must validate the gateway shared-secret.
**Complexity:** Medium — implement gateway shared-secret validation in community-service matching the pattern already used in journal-service and notification-service.
**Dependency:** Must be done before any community-service bug fixes, as authorization is the precondition.

### 4. No Hardcoded Credentials or Infrastructure Endpoints in Committed Config
**Why expected:** Hardcoded database passwords and RunPod proxy URLs in committed config files are caught by every automated secret scanner (GitGuardian, GitHub secret scanning, Snyk). Any capstone evaluator or open-source viewer will see them. This violates twelve-factor app principles and creates real credential rotation risk.
**Complexity:** Low — set placeholders in appsettings.json, move actual values to environment variables. Also update `.env.example` to enumerate all required variables.
**Dependency:** `.env.example` update is a co-requisite.

### 5. Exception Details Not Leaked to API Clients
**Why expected:** Returning `ex.Message` directly in HTTP responses exposes internal stack details, database schema names, and implementation paths to clients. This is OWASP A05 (Security Misconfiguration). RFC 7807 ProblemDetails middleware handles this correctly — generic error to client, full exception to server logs.
**Complexity:** Low-Medium — replace raw `ex.Message` returns in AuthController with generic messages; already use ProblemDetails format in other controllers.
**Dependency:** Pairs well with domain exception types (item below) since typed exceptions map to specific HTTP status codes cleanly.

### 6. Authorization Enforcement on User-Info Endpoint
**Why expected:** A `[Authorize]`-decorated endpoint that does not verify the caller is requesting their own data provides security theatre, not security. `GET /api/auth/user-info/{email}` allows any authenticated user to query any other user's profile. This is OWASP A01 (Broken Access Control), the top web application security risk.
**Complexity:** Low — add a claims check: `email == User.FindFirst(ClaimTypes.Email)?.Value`.
**Dependency:** None. Standalone.

### 7. Timing-Safe API Key Comparison
**Why expected:** String `==` comparison for API keys is vulnerable to timing side-channels. The pattern `CryptographicOperations.FixedTimeEquals()` is already used correctly in the AI Wrapper service and must be applied consistently everywhere API keys are compared. Inconsistency within the same codebase is itself a finding.
**Complexity:** Low — one-line fix in `NotificationCodeController.ValidateApiKey()`.
**Dependency:** None.

### 8. Structured Logging Without PII in Log Messages
**Why expected:** Email addresses in log messages via string interpolation (`$"Registered: {request.Email}"`) violate GDPR Article 5 (data minimisation), HIPAA minimum necessary standard, and will be flagged in any security audit of a mental health app. Mental health data carries heightened sensitivity — logged emails can be correlated to therapy conversations. Using structured placeholders (`{Email}`) allows log-level filtering and PII redaction at the sink layer.
**Complexity:** Low-Medium — 15 call sites in `AuthController.cs` to update. Mechanical change, high volume.
**Dependency:** None. Standalone.

### 9. Middleware Pipeline in Correct Order
**Why expected:** CORS preflight requests being rate-limited causes legitimate browser clients to hit 429 errors. This is a known ASP.NET Core middleware ordering bug that breaks mobile clients behind corporate proxies. Rate limiting must run after CORS and authentication so it can make per-user decisions rather than per-IP decisions on unauthenticated preflight traffic.
**Complexity:** Low — reorder three middleware registrations in `auth-service/Program.cs`.
**Dependency:** None.

### 10. StoredProcedureExecutor Function Name Validation
**Why expected:** SQL injection via function name interpolation is a latent vulnerability. The current callers pass hardcoded strings — but the API surface allows injection if misused in future. Whitelisting `[a-zA-Z0-9_.]` is a two-line fix that closes the attack surface permanently.
**Complexity:** Low — add regex validation in both `StoredProcedureExecutor` implementations.
**Dependency:** None. Can be done in parallel with deduplication.

### 11. Unit and Integration Test Coverage for All Services (80% floor)
**Why expected:** Five of six backend services have zero tests. The one service with the most security-critical logic (auth) has zero tests. Production-readiness for any public-facing system requires test coverage of security paths: authentication, authorization, token generation, account lockout. Without tests, every fix in this milestone is unverified. This is both a capstone requirement and a production readiness gate.
**Complexity:** High — six test projects to create (auth, community, journal, notification, expanded chat, frontend Jest setup). Most effort in this milestone.
**Dependencies:** All other fixes must have companion tests. Test projects are a prerequisite for verifying any fix is complete.

### 12. Docker Compose Fail-Fast for Missing Credentials
**Why expected:** Default fallback passwords in Docker Compose (`:-communitypass`) mean a misconfigured deployment silently starts with known credentials instead of failing loudly. Production deployments must fail fast if required environment variables are absent. This is a twelve-factor app principle and catches deployment mistakes before data is at risk.
**Complexity:** Low — remove the `:-default` fallback syntax from docker-compose.yml for all passwords.
**Dependency:** Requires `.env.example` to enumerate all variables so developers know what to set.

### 13. Container Health Check for Auth Service
**Why expected:** The auth service is the API gateway — all traffic routes through it. Dependent services starting before it is ready causes cascading startup failures. All other services already have health checks; the auth service is the only missing one.
**Complexity:** Low — add `healthcheck` directive to auth-service in docker-compose.yml.
**Dependency:** None.

### 14. Firebase Service Account Validated at Startup
**Why expected:** Silent push notification failure at runtime is worse than a loud startup failure. If the Firebase service account file is missing, the notification service should refuse to start with a clear error rather than starting up and silently dropping all notifications.
**Complexity:** Low — add startup validation in notification-service `Program.cs`.
**Dependency:** None.

---

## Differentiators

Features that go beyond the minimum for a mental health app but are practical within this milestone's scope. These are "nice to have" hardening quality signals — not required, but they distinguish a polished codebase from a merely fixed one.

### 1. Domain Exception Types in Auth Service
**Value:** Replacing `throw new Exception("User already exists")` with `throw new DuplicateEmailException()` enables the exception handler middleware to map business rule violations to correct HTTP status codes (409 Conflict vs. 400 Bad Request vs. 500) and provide useful, non-leaky error messages. It also makes the auth service testable by exception type, not by message string.
**Complexity:** Medium — create 4-6 domain exception classes, update `AuthService.cs`, update exception handler registration.
**Dependency:** Pairs with ProblemDetails exception handler mapping (table stakes item 5).

### 2. Pagination on Chat History Queries
**Value:** Unbounded `SELECT *` on chat history is a latency and memory risk for active users. Adding `limit`/`offset` parameters to the stored procedure prevents the "long conversation" performance cliff. This is a correctness improvement that benefits real users.
**Complexity:** Medium — update stored procedure, `ChatDatabaseProvider`, `SessionService`, and `ChatController` interface. Requires a migration-safe schema change.
**Dependency:** None. Standalone, but test coverage for the endpoint should be added alongside.

### 3. CancellationToken Propagation Through Chat Service
**Value:** When a mobile client disconnects mid-request (app backgrounded, network lost), the chat service currently continues making a 30-second OpenAI API call that no one will receive. Propagating `CancellationToken` through the controller-service-provider chain allows early abort, reducing wasted API costs and server resources.
**Complexity:** Medium — thread `CancellationToken ct = default` through `ChatController`, `IChatService`, `SessionService`, `IChatWrapperClientInterface`.
**Dependency:** Requires updating interface signatures. Existing integration test must be updated to match.

### 4. Input Sanitization and Length Validation for User-Generated Content
**Value:** Community posts, journal entries, and chat messages have no length limits or HTML sanitization. While React Native does not render HTML, the data is stored in PostgreSQL and could be rendered in future web interfaces or exported. Enforcing max lengths prevents database bloat from intentional abuse and is a baseline content integrity measure.
**Complexity:** Low-Medium — add length validation in service methods; HTML sanitization via `HtmlSanitizer` NuGet package or a simple strip-tags utility.
**Dependency:** Pairs with community service authentication fix (differentiator is not useful if the endpoint is still unauthenticated).

### 5. Wearable Service Stub Resolved (Remove or Replace)
**Value:** A service that returns `null` and `false` for every method, coupled with a UI that calls it, erodes user trust when health data features silently do nothing. Removing the stub from the UI is one line of navigation change; it eliminates user confusion at no cost. The alternative — implementing real wearable integration — is explicitly out of scope for this milestone.
**Complexity:** Low — remove `WearableSettingsScreen` from navigation or display a "Coming soon" placeholder. Do not implement the full feature.
**Dependency:** None.

### 6. Deduplicated StoredProcedureExecutor
**Value:** Two near-identical classes in journal-service and notification-service means security patches must be applied twice. Extracting to a shared project eliminates divergence risk. The function name injection fix (table stakes item 10) is a concrete example of a bug that must currently be fixed in two places.
**Complexity:** Medium — create a shared class library project, update both service `.csproj` references, verify build.
**Dependency:** Apply function name validation fix before extracting, so the shared version is already hardened.

### 7. In-Memory Rate Limiting Documented as Scaling Limitation
**Value:** The current in-memory rate limiting in auth-service and AI-wrapper is not wrong for a single-instance deployment, but it is wrong for multi-instance. Documenting this explicitly in code comments and `README` prevents a future engineer from assuming the rate limiting scales horizontally. This is an honest production note, not a fix.
**Complexity:** Very low — add a code comment and a section in deployment docs.
**Dependency:** None.

---

## Anti-Features

Things to explicitly NOT do during this hardening milestone. These are common over-engineering traps that would consume time without improving safety or reliability.

### 1. Do Not Implement Redis-Backed Rate Limiting
**Why avoid:** Redis-backed rate limiting is correct for multi-instance deployments. But this is a single-instance deployment today. Migrating rate limiting to Redis during a hardening sprint introduces new infrastructure complexity, new failure modes (Redis availability), and a new dependency — none of which fix any current vulnerability. The right action is to document the limitation (differentiator item 7) and schedule Redis backing as a scaling milestone.
**What to do instead:** Add a code comment noting the limitation. Move on.

### 2. Do Not Implement Full Wearable Integration
**Why avoid:** `react-native-health` and `react-native-health-connect` require native modules, build configuration changes, and platform permissions. This is feature work, not hardening. It is explicitly out of scope.
**What to do instead:** Remove the stub from the navigation or show a "Coming soon" state.

### 3. Do Not Add HTTPS/TLS Configuration to Services
**Why avoid:** TLS termination belongs at the reverse proxy or load balancer layer (nginx, Caddy, a cloud load balancer), not inside the application service. Adding it to each ASP.NET Core service duplicates certificate management, complicates Docker networking, and is the wrong architectural layer for this concern.
**What to do instead:** Document that a TLS-terminating reverse proxy (e.g., nginx with Let's Encrypt) is required in front of the auth-service gateway for production deployments.

### 4. Do Not Upgrade .NET Versions During Hardening
**Why avoid:** Upgrading chat-service from .NET 8 to .NET 9 introduces breaking changes, package incompatibilities, and the need to re-verify all existing behavior. This is a known out-of-scope item. Even minor version upgrades introduce surface area that must be re-tested.
**What to do instead:** Unify versions in a separate milestone after hardening is complete and tests prove baseline behavior.

### 5. Do Not Add ESLint or Prettier to the Frontend
**Why avoid:** Linting and formatting configuration changes will trigger hundreds of style-only file modifications that obscure the actual security and reliability fixes in git history. A reviewer cannot easily distinguish a PII fix from a whitespace normalization in a noisy diff.
**What to do instead:** Add linting configuration in a separate commit or milestone after all hardening fixes are merged.

### 6. Do Not Replace Dapper with Entity Framework Core
**Why avoid:** Dapper with stored procedures works correctly and is already battle-tested in this codebase. Migrating the ORM during a hardening sprint would require rewriting all data access code, creating new migration risk, and deferring actual security fixes. The stored procedure injection risk (table stakes item 10) is a two-line fix that does not require an ORM change.
**What to do instead:** Keep Dapper. Fix the injection surface. Write tests against the existing implementation.

### 7. Do Not Add CI/CD Pipeline Configuration
**Why avoid:** CI/CD is explicitly out of scope for this milestone. Adding GitHub Actions or Azure DevOps pipelines creates new YAML files to maintain, introduces build agent considerations, and is better done after tests are stable and all fixes are merged.
**What to do instead:** Ensure tests run locally with `dotnet test`. CI/CD is a follow-on milestone.

---

## Feature Dependencies

The following ordering constraints are derived from logical dependencies between hardening features:

```
Community auth middleware (table stakes 3)
  → Community input sanitization (differentiator 4)
  [Cannot sanitize for an endpoint that is still unauthenticated]

StoredProcedureExecutor injection fix (table stakes 10)
  → StoredProcedureExecutor deduplication (differentiator 6)
  [Extract a hardened version, not a vulnerable one]

Exception leakage fix (table stakes 5)
  → Domain exception types (differentiator 1)
  [Exception handler maps domain types to responses; build the handler first]

.env.example enumeration (table stakes 4)
  → Docker Compose fail-fast (table stakes 12)
  [Removing defaults requires devs to have a reference for what to set]

Test projects (table stakes 11)
  ← All other fixes
  [Every fix must have a companion test; tests verify the fix works]
```

---

## MVP Recommendation

The minimum set of items that makes this codebase production-safe for real users, in priority order:

**Must ship (blocks production use):**
1. Cryptographically secure verification codes (table stakes 1)
2. 2FA codes not logged (table stakes 2)
3. Community service authentication (table stakes 3)
4. No hardcoded credentials (table stakes 4)
5. Exception details not leaked (table stakes 5)
6. User-info authorization check (table stakes 6)
7. Timing-safe API key comparison (table stakes 7)
8. Structured logging without PII (table stakes 8)
9. Test coverage for auth service (subset of table stakes 11)
10. Docker Compose fail-fast (table stakes 12)

**Can follow in second pass (important but not blocking):**
- Middleware order fix (table stakes 9)
- StoredProcedureExecutor validation (table stakes 10)
- Remaining test projects (table stakes 11 — community, journal, notification, frontend)
- Container health check (table stakes 13)
- Firebase startup validation (table stakes 14)
- All differentiators

**Defer permanently (anti-features):**
- Redis rate limiting, wearable integration, HTTPS in services, ORM migration, CI/CD, linting

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Security requirements (OWASP, .NET) | HIGH | Grounded in OWASP cheat sheet, Microsoft Learn official docs, and direct CONCERNS.md audit |
| Mental health data sensitivity | HIGH | GDPR special category, HIPAA sensitivity, confirmed by multiple 2025 regulatory sources |
| Test tooling (xUnit, Jest, RTL) | HIGH | Verified against official xUnit docs, React Native official testing docs, and Expo unit testing docs |
| ProblemDetails exception pattern | HIGH | Verified against Microsoft Learn and Andrew Lock's authoritative .NET blog |
| React Native secure storage | HIGH | Verified against official React Native security docs; expo-secure-store already in use |
| Complexity estimates | MEDIUM | Based on code structure observed in CONCERNS.md; actual complexity may differ for unfamiliar services |

---

## Sources

- [OWASP .NET Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DotNet_Security_Cheat_Sheet.html)
- [ASP.NET Core Security Topics — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/security/?view=aspnetcore-9.0)
- [Handle Errors in ASP.NET Core APIs — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling-api?view=aspnetcore-10.0)
- [Best Practices to Secure ASP.NET Core APIs 2025 — C# Corner](https://www.c-sharpcorner.com/article/best-practices-to-secure-asp-net-core-apis-against-modern-attacks-2025-edition/)
- [React Native Security Docs (official)](https://reactnative.dev/docs/security)
- [React Native Testing Docs (official)](https://reactnative.dev/docs/testing-overview)
- [Expo Unit Testing Guide](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing Library — GitHub](https://github.com/callstack/react-native-testing-library)
- [HIPAA Compliance for Mental Health Apps — Arkenea 2026](https://arkenea.com/blog/guide-hipaa-compliance/)
- [GDPR Compliance for Mental Health Apps — GDPR Advisor](https://www.gdpr-advisor.com/gdpr-compliance-for-mental-health-apps-safeguarding-sensitive-data/)
- [Mental Health App Data Privacy: HIPAA-GDPR Hybrid — SecurePrivacy](https://secureprivacy.ai/blog/mental-health-app-data-privacy-hipaa-gdpr-compliance)
- [HHS Resources for Mobile Health App Developers](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-apps/index.html)
- [Testing ASP.NET Core Services — Microsoft Architecture Guide](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/test-aspnet-core-services-web-apps)
- [Handling Web API Exceptions with ProblemDetails — Andrew Lock](https://andrewlock.net/handling-web-api-exceptions-with-problemdetails-middleware/)
- [Structured Logging with Serilog for Production — DAP iQ](https://dapiq.com/insights/structured-logging-serilog-production)
