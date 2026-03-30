# Project Research Summary

**Project:** AI Wellness Platform (Sakina) — Hardening Milestone
**Domain:** Security hardening and test retrofitting for .NET microservices + React Native mobile app
**Researched:** 2026-03-29
**Confidence:** HIGH

## Executive Summary

This is a codebase hardening effort on a working but production-unsafe system: a six-service .NET microservices backend (ASP.NET Core 8/9, PostgreSQL, Redis) paired with a React Native/Expo 54 mobile frontend. The app processes sensitive mental health data — conversations about depression, crisis states, and personal trauma — which places several "moderate" security practices into critical territory. The research finds that the codebase is not safe for real users in its current state: it has a completely unauthenticated service (community-service), a compromised 2FA implementation (both logged plaintext and non-cryptographic RNG), hardcoded credentials in committed history, and five of six backend services with zero test coverage.

The recommended approach follows a concentric-ring hardening model: fix the authentication perimeter first (auth-service and community-service), then secure internal communication, then establish test infrastructure to prove every fix, and finally address reliability and tech debt. This order is non-negotiable — downstream services are only as secure as the gateway that authenticates their traffic. The AI-Wrapper-Service is the sole service with a complete test suite and represents the reference implementation pattern for all new test projects.

The key risks are coupling between fixes (exception exposure cannot be fixed without domain exceptions, or the frontend breaks), secrets already committed to git history (code removal is not the same as rotation), and the danger of writing characterization tests that assert buggy behavior rather than proving fixes. These risks are well-understood and preventable with the discipline of treating related fixes as atomic units and writing tests in RED-first order.

---

## Key Findings

### Recommended Stack

No new application frameworks are introduced in this milestone. The hardening toolchain layers onto the existing stack with zero runtime additions. For backend testing, the project already has xUnit, Moq, and FluentAssertions in use on the AI-Wrapper-Service — these must be standardized across all new test projects. For integration testing requiring real database behavior, Testcontainers.PostgreSql (v4.11.0) and Respawn (v7.0.0) are the correct additions. For static analysis, Microsoft.CodeAnalysis.NetAnalyzers (v10.0.104) and SecurityCodeScan.VS2019 (v5.6.7) run at build time with zero CI infrastructure requirements. For the frontend, jest-expo (~54.0.17) with @testing-library/react-native (^13.3.3) is the only viable testing stack for an Expo 54 project.

**Core technologies:**
- `xUnit` + `Moq` + `FluentAssertions` (existing): Standardize as the test baseline across all 6 backend services — no second runner
- `Testcontainers.PostgreSql` 4.11.0 + `Respawn` 7.0.0: Real PostgreSQL for integration tests against stored procedures without live Docker Compose
- `Bogus` 35.6.5: Realistic test data generation — eliminates hardcoded `"test@test.com"` literals throughout test code
- `Microsoft.AspNetCore.Mvc.Testing` (9.x/8.x per TFM): In-process HTTP test server following the pattern already used in AIWrapperService.Tests
- `Microsoft.CodeAnalysis.NetAnalyzers` 10.0.104: Build-time SAST covering CA2100 (SQL injection from string concat) and CA5350/CA5351 (weak crypto)
- `SecurityCodeScan.VS2019` 5.6.7: Build-time inter-procedural taint analysis for injection, XSS, path traversal — runs as Roslyn analyzer, never ships to runtime
- `jest-expo` ~54.0.17 + `@testing-library/react-native` ^13.3.3: Official Expo-blessed Jest preset plus stable component testing library for React 19 / Expo SDK 54
- `dotnet list package --vulnerable --include-transitive` + NuGet Audit in `Directory.Build.props`: Zero-install CVE scanning for all NuGet dependencies
- `npm audit --audit-level=high`: Zero-install CVE scanning for JavaScript dependencies

**What NOT to add:** SonarQube (requires server infrastructure), Detox (E2E, out of scope), ESLint/Prettier (linting creates noisy diffs during hardening), Entity Framework Core (ORM migration is not hardening), Redis-backed rate limiting (correct for multi-instance, wrong priority now), HTTPS in services (TLS termination belongs at the reverse proxy layer).

### Expected Features

The hardening features map to three tiers with a clear MVP boundary.

**Must have (blocks production use):**
- Cryptographically secure verification codes — replace `new Random()` with `RandomNumberGenerator.GetInt32` in auth-service
- 2FA codes not logged in plaintext — remove the INFO-level log statement that defeats multi-factor authentication entirely
- Community-service authentication middleware — shared-secret gateway validation is completely absent; any actor reaching port 8084 can forge any user identity
- Hardcoded credentials removed from committed config — community-service DB password and RunPod proxy URL require rotation before removal
- Exception details not leaked to API clients — `ex.Message` returned directly in HTTP responses exposes internal schema details
- User-info endpoint authorization — `GET /api/auth/user-info/{email}` allows any authenticated user to query any other user's profile (OWASP A01)
- Timing-safe API key comparison — `CryptographicOperations.FixedTimeEquals()` is used correctly in AI-Wrapper but missing in notification-service
- Structured logging without PII — 15+ call sites in AuthController interpolate email addresses directly into log strings (GDPR, HIPAA risk)
- Test coverage for auth-service security paths — 80% floor; every fix requires a companion test
- Docker Compose fail-fast for missing credentials — default fallback passwords silently start production with known credentials

**Should have (important but not blocking):**
- Middleware pipeline order fix in auth-service — rate limiter before CORS causes 429 on legitimate preflight requests
- StoredProcedureExecutor function name whitelist — latent SQL injection surface; two-line fix closing a permanent attack vector
- Test projects for community, journal, notification services and frontend Jest setup
- Container health check for auth-service gateway
- Firebase service account startup validation
- Domain exception types in auth-service — required to fix exception exposure without breaking frontend error messages
- Chat history pagination — unbounded SELECT on active users is a correctness and latency problem
- CancellationToken propagation through chat-service — prevents wasted OpenAI API calls when clients disconnect

**Defer permanently (anti-features):**
- Redis-backed rate limiting, full wearable integration, HTTPS inside services, Dapper-to-EF Core migration, CI/CD pipeline, ESLint/Prettier

### Architecture Approach

Hardening this distributed system follows the runtime trust chain as its dependency order. The auth-service is the YARP API gateway through which all external traffic flows; every downstream service is only as secure as the gateway. community-service is the single highest-risk service — it has no authentication barrier at all. The correct fix pattern already exists in notification-service and journal-service (shared-secret middleware) and must be replicated, not invented. The AIWrapperService.Tests project is the reference implementation for all new test project structure: `CustomWebApplicationFactory<TProgram>`, `IClassFixture`, `Fixtures/` directory with service-specific test helpers, and separate `Unit/` and `Integration/` directories.

**Major components and hardening ownership:**
1. **auth-service** — Gateway + identity: 2FA log removal, CSPRNG replacement, PII logging fix, GetUserInfo authorization, exception exposure, rate limiter order. Zero tests currently.
2. **community-service** — User-generated content: Add shared-secret validation middleware (pattern from notification-service), remove hardcoded DB password. Zero tests currently.
3. **notification-service** — Code delivery: Timing-unsafe API key comparison (one-line fix), StoredProcedureExecutor injection risk. Zero tests currently.
4. **journal-service** — Entry persistence: StoredProcedureExecutor injection risk, no pagination. Zero tests currently.
5. **chat-service** — Session + messaging: Mutable session entity, no CancellationToken, no pagination. One integration test file (uses live-DB anti-pattern).
6. **AI-Wrapper-Service** — LLM proxy: Hardcoded RunPod URL in config. Full test suite — reference implementation for all other services.
7. **frontend** — React Native mobile: No test framework, wearable stub calling dead service, no input length validation. Zero tests.

### Critical Pitfalls

1. **Fixing secrets without rotating them** — Removing `Password=postgres` from `appsettings.json` does not remove it from git history. Every committed secret is already leaked. Rotate the credential first, then remove the code. Run `git log --all -S "Password=postgres"` to confirm history exposure. Consider BFG Repo Cleaner for evaluated/public repos.

2. **Fixing 2FA log without fixing the non-cryptographic RNG** — These are listed as separate CONCERNS.md items but are a single vulnerability. Even with the log removed, `System.Random` produces predictable codes an attacker can enumerate. Fix both as one atomic commit: remove the log statement AND replace `new Random()` with `RandomNumberGenerator.GetInt32`.

3. **Exception exposure fix breaking frontend error messages** — `AuthController` currently returns `ex.Message` to distinguish between "Email already registered" and "Account is locked." Replacing all `ex.Message` with a generic message (without first creating typed domain exceptions) silently breaks the registration and login UX. The fix order is mandatory: create domain exception types first, throw them from AuthService, map them in the exception handler, then replace the raw `ex.Message` returns.

4. **Community-service middleware registered after `MapControllers()`** — Adding authentication middleware in the wrong pipeline position means controllers execute before the check runs. The service appears protected but is not. Write an integration test that sends a request without the gateway shared secret and asserts 401 before implementing the fix.

5. **Writing characterization tests that encode bugs as expected behavior** — When retrofitting tests on five zero-coverage services, the temptation is to observe current behavior and write assertions to match it. Any test that passes before the fix it is intended to prove is a characterization test. Write tests RED-first: the test must fail against the current broken code and pass only after the fix.

---

## Implications for Roadmap

Based on the combined research, the dependency structure is clear and non-negotiable. The recommended structure is five phases following the concentric-ring model identified in ARCHITECTURE.md.

### Phase 1: Perimeter Security

**Rationale:** The auth-service is the gateway for all traffic. community-service is completely unauthenticated. These two services control access for everything downstream. Until they are fixed, no other security work provides meaningful protection. All critical pitfalls (#2, #3, #4) occur in this phase.

**Delivers:** A system where all six services require authentication, 2FA is cryptographically sound, no credentials are exposed via logs or exception messages, and user data is not accessible cross-user.

**Addresses:** FEATURES.md table stakes items 1–8 (CSPRNG, 2FA log, community auth, hardcoded credentials, exception exposure, user-info authz, timing-safe comparison, PII logging).

**Avoids:**
- Pitfall 1: Rotate community-service DB password and RunPod URL before removing from config
- Pitfall 2: Fix 2FA log and CSPRNG in a single atomic commit
- Pitfall 3: Create domain exception types before fixing exception exposure in AuthController
- Pitfall 4: Write integration tests for community-service auth middleware and verify position before implementing

**Required sub-ordering within phase:**
1. Domain exception types (auth-service/Exceptions/) — prerequisite for exception exposure fix
2. CSPRNG + 2FA log removal — atomic pair
3. GetUserInfo authorization claim check
4. PII logging fix (15 call sites in AuthController)
5. Community-service shared-secret middleware (replicate notification-service pattern)
6. Hardcoded credentials replaced with placeholders, `.env.example` updated
7. RunPod URL removed from AI-Wrapper-Service config

### Phase 2: Internal Communication Security

**Rationale:** With the perimeter secured, fix the one timing-side-channel vulnerability in internal service-to-service communication and close the SQL injection surface on the stored procedure executor used in two services.

**Delivers:** Timing-safe API key comparison throughout all internal communications; SQL injection attack surface permanently closed on the stored procedure layer.

**Addresses:** FEATURES.md table stakes items 7 (timing-safe comparison — notification-service), 9 (middleware order), 10 (StoredProcedureExecutor validation).

**Avoids:**
- Pitfall 8: Write a rate limiting test before reordering auth-service middleware to confirm behavior is preserved
- Pitfall 9: Audit all StoredProcedureExecutor callers for schema-qualified names (e.g., `public.fn_name`) before writing the regex whitelist; include dot in the pattern `^[a-zA-Z0-9_.]+$`

**Key work:**
- Timing-safe API key comparison in notification-service (one-line fix, reference: AI-Wrapper InternalApiKeyMiddleware.cs)
- StoredProcedureExecutor function name whitelist in both journal-service and notification-service (independent fixes, do not extract to shared library yet)
- Rate limiting middleware reorder in auth-service (test before and after)

### Phase 3: Test Infrastructure

**Rationale:** Every Phase 1 and 2 fix is currently unverified by tests. This phase establishes test projects for all five untested services and the frontend, then writes tests that prove the security fixes are correct and will not silently regress. This phase is infrastructure work — it is not writing happy-path tests; it is building the safety net.

**Delivers:** Six new test projects (auth-service.Tests, community-service.Tests, journal-service.Tests, notification-service.Tests, expanded chat-service.Tests, frontend Jest setup) with tests covering every Phase 1/2 fix and the 80% coverage floor for auth-service security paths.

**Uses:** Testcontainers.PostgreSql, Respawn, Bogus, Microsoft.AspNetCore.Mvc.Testing, jest-expo, @testing-library/react-native (all from STACK.md).

**Avoids:**
- Pitfall 5: All tests written RED-first; any test passing before the fix it targets is invalid
- Pitfall 6: Wrap BCrypt behind `IPasswordHasher` interface; use work factor 4 in test configuration
- Pitfall 7: Do not extend the live-database anti-pattern in chat-service.Tests; use WebApplicationFactory + mocked providers
- Pitfall 10: Use IsolatedWebApplicationFactory for any test touching rate limiting or caching middleware state
- Pitfall 11: Mock `expo-secure-store` at module level; use `waitFor` for all async AuthContext assertions

**Priority test targets:**
1. auth-service security paths (CSPRNG generates unpredictable codes; 2FA log absent; GetUserInfo returns 403 for cross-user requests; duplicate email returns 409 not 500)
2. community-service authentication (requests without gateway secret return 401; requests with valid secret succeed)
3. notification-service API key comparison (timing-safe comparison test)
4. Frontend: `AuthContext.js` (login/logout/persist/restore flows), `api.js` (token injection, error handling), `chatApi.js` (normalizeMessage, normalizeSession)

### Phase 4: Reliability and Performance

**Rationale:** With security established and proven by tests, address the correctness issues that affect real users under real load. These are not security fixes — they are the issues that would cause performance degradation or data loss in production.

**Delivers:** Bounded query results (pagination on chat history), early cancellation of abandoned AI requests (CancellationToken propagation), immutable session state (eliminates mutation bugs in SessionService), and sanitized user-generated content.

**Addresses:** FEATURES.md differentiators 2, 3, 4 (pagination, CancellationToken, input sanitization).

**Key work:**
- Chat history pagination: update stored procedure, ChatDatabaseProvider, SessionService, ChatController (migration-safe)
- CancellationToken propagation: thread through ChatController → IChatService → IChatWrapperClientInterface (updates interface signatures; existing integration test must be updated)
- Session entity immutability in SessionService (mutation bug fix)
- Input length validation and HTML sanitization for community posts, journal entries

### Phase 5: Tech Debt and Configuration

**Rationale:** Low-risk cleanup that does not change security posture or functional behavior. Isolated changes that reduce future maintenance cost and close the Docker configuration gaps that affect deployment correctness.

**Delivers:** Clean deployment configuration, honest documentation of scaling limitations, removal of dead code.

**Addresses:** FEATURES.md table stakes 12 (Docker fail-fast), 13 (auth-service health check), 14 (Firebase startup validation); differentiators 5 (wearable stub removal), 6 (StoredProcedureExecutor deduplication note), 7 (rate limiting scaling documentation).

**Avoids:**
- Pitfall 12: Do not remove host port mappings from the main docker-compose.yml; use a docker-compose.prod.yml override instead
- Pitfall 13: Search all import sites before deleting wearableService.js; remove in dependency order (navigation entry → screen → service file)

**Key work:**
- Docker Compose: remove default password fallbacks (fail-fast), add auth-service health check, annotate port exposure for production override
- `.env.example`: enumerate all required environment variables
- Firebase service account startup validation in notification-service
- Wearable service stub: remove from navigation or show "Coming soon" state; delete service file last
- StoredProcedureExecutor: apply hardened fix to both files independently; add comment noting duplication for future extraction
- In-memory rate limiting: add code comment noting single-instance limitation

---

### Phase Ordering Rationale

- **Security before tests** (Phase 1 and 2 before Phase 3): Tests prove fixes are correct; writing tests first on broken code risks characterization tests. The correct order is fix-then-prove, not test-then-fix, because the fixes are already known from the audit.
- **Perimeter before internal** (Phase 1 before Phase 2): community-service has zero authentication; notification-service has a timing side-channel. These are different severity levels. A system with a completely open service is more dangerous than one with a timing leak.
- **Infrastructure before features** (Phase 3 before Phase 4): Reliability fixes without tests are unverified. Phase 4 work (pagination, CancellationToken) must ship with tests proving correctness.
- **Configuration last** (Phase 5): Docker and deployment config changes have zero risk of introducing security regressions. They are correctly deferred to avoid scope mixing during the critical security phase.

---

### Research Flags

**Phases requiring attention during planning:**

- **Phase 1** — The coupling between domain exception types and exception exposure fix is a sequencing constraint that must be made explicit in task ordering. If the planner lists these as independent tasks, they will be executed out of order and produce a broken state.
- **Phase 3** — Frontend test setup (jest-expo version pinning against Expo SDK 54) should be verified against Expo 54 release notes before committing; the jest-expo ~54.0.17 version recommendation is HIGH confidence but the exact transformIgnorePatterns configuration may need adjustment for any Expo module the project uses that is not in the standard list.
- **Phase 4** — CancellationToken propagation through ChatController requires updating `IChatService` and `IChatWrapperClientInterface` signatures; the existing integration test in chat-service.Tests must be updated to match. This is a broader interface change than it appears.

**Phases with standard, well-documented patterns (no additional research needed):**

- **Phase 2** — Timing-safe comparison (`CryptographicOperations.FixedTimeEquals`) is a one-line fix; the correct implementation is already live in InternalApiKeyMiddleware.cs in this repo.
- **Phase 5** — Docker Compose configuration changes are mechanical and low-risk.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All tools verified on NuGet Gallery / npm (March 2026). xUnit, Moq, FluentAssertions already in codebase. SecurityCodeScan is MEDIUM due to deprecated original package — VS2019 variant is the maintained fork; .NET 9 compatibility confirmed via community reports. |
| Features | HIGH | Grounded in OWASP cheat sheets, Microsoft Learn official docs, direct CONCERNS.md audit. Complexity estimates are MEDIUM — based on code structure observed in audit, actual complexity may vary for unfamiliar services. |
| Architecture | HIGH | Phase structure derived from existing code inspection of the real codebase + verified Microsoft middleware ordering documentation. AIWrapperService.Tests is a live reference implementation. |
| Pitfalls | HIGH | Critical pitfalls are grounded in official sources (Microsoft Learn, xUnit project, React Native Testing Library docs) and direct codebase analysis. Minor pitfalls (Docker port removal, wearable stub) are from codebase inspection. |

**Overall confidence:** HIGH

### Gaps to Address

- **BCrypt abstraction pattern**: The `IPasswordHasher` wrapper needed for auth-service test performance is not currently in the codebase. The planner should treat creating this interface as a prerequisite task for the auth-service test project, not an optional improvement.
- **Testcontainers vs. mocked repositories decision**: For auth-service integration tests, the research recommends unit tests with mocked `IUserRepository` as sufficient for this milestone, deferring real database integration tests. This trade-off should be confirmed during Phase 3 planning — Testcontainers is installed but the decision of which test classes use it versus mocks should be made explicitly.
- **git history secret scrubbing**: Whether to run BFG Repo Cleaner on the repo history (for the committed `Password=postgres`) is a decision that requires the project owner's input. The research flags it as necessary for a public or evaluated repository but defers the decision.
- **SecurityCodeScan.VS2019 .NET 9 compatibility**: Community-confirmed but not officially documented. If build-time errors appear, the `AdaskoTheBeAsT.SecurityCodeScan.VS2022` community fork (v5.6.7.50) is the fallback.

---

## Sources

### Primary (HIGH confidence)
- [ASP.NET Core Integration Tests — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests)
- [ASP.NET Core Middleware Ordering — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/)
- [Safe storage of app secrets in ASP.NET Core — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets)
- [OWASP .NET Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DotNet_Security_Cheat_Sheet.html)
- [OWASP Microservices Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Microservices_Security_Cheat_Sheet.html)
- [Expo Unit Testing Guide](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing Library — official docs](https://oss.callstack.com/react-native-testing-library/)
- [Testcontainers.PostgreSql on NuGet](https://www.nuget.org/packages/Testcontainers.PostgreSql) — v4.11.0 confirmed March 2026
- [Microsoft.CodeAnalysis.NetAnalyzers on NuGet](https://www.nuget.org/packages/Microsoft.CodeAnalysis.NetAnalyzers) — v10.0.104 (March 2026)
- [NuGetAudit 2.0 — Microsoft DevBlog](https://devblogs.microsoft.com/dotnet/nugetaudit-2-0-elevating-security-and-trust-in-package-management/)
- In-repo: `AI-Wrapper-Service/AIWrapperService.Tests/` — live reference implementation for test project structure
- In-repo: `AI-Wrapper-Service/AIWrapperService/Middleware/InternalApiKeyMiddleware.cs` — correct timing-safe API key comparison
- In-repo: `.planning/codebase/CONCERNS.md` and `.planning/codebase/TESTING.md` — primary audit source

### Secondary (MEDIUM confidence)
- [SecurityCodeScan.VS2019 on NuGet](https://www.nuget.org/packages/SecurityCodeScan.VS2019/) — v5.6.7 (original package deprecated; VS2019 variant is maintained fork)
- [Handling Web API Exceptions with ProblemDetails — Andrew Lock](https://andrewlock.net/handling-web-api-exceptions-with-problemdetails-middleware/)
- [WebApplicationFactory shared state pitfalls — xUnit Discussion](https://github.com/xunit/xunit/discussions/2893)
- [ByteCrafted — Correct Middleware Order](https://bytecrafted.dev/posts/aspnet-core/middleware-order-best-practices/)
- [HIPAA Compliance for Mental Health Apps — Arkenea 2026](https://arkenea.com/blog/guide-hipaa-compliance/)
- [GDPR Compliance for Mental Health Apps — GDPR Advisor](https://www.gdpr-advisor.com/gdpr-compliance-for-mental-health-apps-safeguarding-sensitive-data/)
- [Common Microservices Security Vulnerabilities — Technori 2026](https://technori.com/2026/03/25085-common-security-vulnerabilities-in-microservices-and-prevention/gabriel/)

### Tertiary (LOW confidence)
- [Why Retrofitting Tests is Hard — Medium](https://modelephant.medium.com/software-engineering-why-retrofitting-tests-is-hard-9ea4e7af3e48) — characterization test pitfall context; practitioner experience only

---
*Research completed: 2026-03-29*
*Ready for roadmap: yes*
