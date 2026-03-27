# Requirements: AI Wellness Platform — Hardening

**Defined:** 2026-03-25
**Core Value:** Security first — fix vulnerabilities and protect user data before anything else

## v1 Requirements

Requirements for this hardening milestone. Each maps to roadmap phases.

### Security

- [ ] **SEC-01**: Log PII masking — emails masked as `u***r@example.com` in all log output; 2FA codes never logged
- [ ] **SEC-02**: Verification codes generated with `RandomNumberGenerator` producing 8+ character alphanumeric codes
- [ ] **SEC-03**: Verification codes hashed (BCrypt/Argon2) before database storage with explicit `ExpiresAt` TTL column
- [ ] **SEC-04**: Brute-force protection on `/api/auth/verify-email` with per-email rate limiting and lockout after 5 failed attempts
- [ ] **SEC-05**: JWT `ValidateLifetime = true` and `ClockSkew = TimeSpan.Zero` explicitly set in all services' JWT bearer configuration
- [ ] **SEC-06**: Input length validation on session names and chat messages before database insert using FluentValidation
- [ ] **SEC-07**: Per-API-key rate limiting in AI Wrapper Service (not just per-IP)
- [ ] **SEC-08**: Verified that no real API keys or secrets exist in source-controlled `appsettings.json` files; documented secure configuration approach

### Error Handling

- [ ] **ERR-01**: Domain-specific exception types created for all error cases across Auth, Chat, and AI Wrapper services (replacing 27+ generic `throw new Exception()`)
- [ ] **ERR-02**: Exception handler does not leak internal exception type names to API consumers
- [ ] **ERR-03**: All error responses use RFC 7807 ProblemDetails format consistently across all services
- [ ] **ERR-04**: Auth Service and Chat Service upgraded to .NET 8 `IExceptionHandler` chain pattern (replacing custom `ExceptionHandlingMiddleware`)

### Bugs

- [ ] **BUG-01**: Chat message role (`user`/`assistant`) stored explicitly in database with `role` column; index-based heuristic removed from backend
- [ ] **BUG-02**: Frontend `chatApi.js` reads role from API response instead of inferring from array position
- [ ] **BUG-03**: Chat message status enum uses meaningful values (`pending`, `delivered`, `error`, `archived`) instead of `enums.Status.dummy1`

### Performance

- [ ] **PERF-01**: All database access uses `_dataSource.OpenConnectionAsync()` exclusively; no direct `new NpgsqlConnection()` instantiation
- [ ] **PERF-02**: `NpgsqlDataSourceBuilder` configured with explicit `MaxPoolSize` (20-50) and `ConnectionIdleLifetime`
- [ ] **PERF-03**: Chat history retrieval supports cursor-based pagination with `limit` parameter (default 50) and `hasMore` flag
- [ ] **PERF-04**: Session cache entries have TTL-based expiration (30-60 minutes) preventing unbounded memory growth

### Testing

- [ ] **TEST-01**: Integration tests verify chat history role assignment correctness (including consecutive same-sender messages)
- [ ] **TEST-02**: Integration tests verify session authorization boundary (User A cannot access User B's sessions)
- [ ] **TEST-03**: Tests verify password reset codes expire correctly and cannot be reused after expiry
- [ ] **TEST-04**: Unit tests verify graceful handling of OpenAI API errors (429 rate limit, 503 unavailable, timeout)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Security

- **SEC-D01**: Per-request OpenAI API key injection (eliminate `HttpClient.DefaultRequestHeaders` persistence)
- **SEC-D02**: Constant-time response for user enumeration prevention on password reset
- **SEC-D03**: Stored procedure name constants (compile-time safety)

### Performance

- **PERF-D01**: Chat history stored as PostgreSQL JSONB column (eliminate serialization round-trips)
- **PERF-D02**: N+1 query elimination on session listing (aggregate view with message count and last message)
- **PERF-D03**: Configurable AI model name with Polly-based fallback on deprecation

### Testing

- **TEST-D01**: Connection pool exhaustion integration tests under concurrent load
- **TEST-D02**: Polly resilience tests (retry backoff, circuit breaker behavior)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| TOTP/authenticator-app 2FA upgrade | New feature scope; fix existing code generation first |
| Distributed rate limiting with Redis | Infrastructure complexity; in-process counters sufficient at current scale |
| HybridCache migration | Architecture change; fix TTL eviction in existing cache first |
| CQRS / MediatR pipeline behaviors | New architecture; FluentValidation without pipeline sufficient |
| Azure Key Vault / AWS Secrets Manager | Infrastructure concern; document env vars approach instead |
| Database schema redesign (EF Core migration) | Major refactor; string constants address the typo risk |
| E2E mobile testing (Detox/Playwright) | New test infrastructure; fix the backend-tied frontend bug only |
| Serilog structured logging with correlation IDs | Differentiator; focus on PII masking first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 2 | Pending |
| SEC-05 | Phase 2 | Pending |
| SEC-06 | Phase 4 | Pending |
| SEC-07 | Phase 4 | Pending |
| SEC-08 | Phase 2 | Pending |
| ERR-01 | Phase 1 | Pending |
| ERR-02 | Phase 1 | Pending |
| ERR-03 | Phase 1 | Pending |
| ERR-04 | Phase 1 | Pending |
| BUG-01 | Phase 3 | Pending |
| BUG-02 | Phase 3 | Pending |
| BUG-03 | Phase 3 | Pending |
| PERF-01 | Phase 3 | Pending |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 5 | Pending |
| PERF-04 | Phase 5 | Pending |
| TEST-01 | Phase 6 | Pending |
| TEST-02 | Phase 6 | Pending |
| TEST-03 | Phase 6 | Pending |
| TEST-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation — all 23 requirements mapped*
