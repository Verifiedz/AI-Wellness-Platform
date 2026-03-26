# Roadmap: AI Wellness Platform — Hardening Milestone

## Overview

Six phases transform the platform from a structurally sound but vulnerable microservices skeleton into a hardened, production-safe system. Phase 1 lays the exception infrastructure that every subsequent fix depends on. Phases 2 and 3 address Auth Service security and Chat Service bugs in parallel. Phase 4 wires input validation and hardens the AI Wrapper. Phase 5 adds performance and scaling safeguards. Phase 6 fills test coverage gaps to prove all fixes hold. Every phase ends with a verifiable, observable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Exception Infrastructure** - Domain exception hierarchy and IExceptionHandler chain replacing custom middleware across Auth and Chat services
- [ ] **Phase 2: Auth Service Security Hardening** - Log PII masking, cryptographically secure verification codes, brute-force protection, and JWT lifetime enforcement
- [ ] **Phase 3: Chat Service Bugs and Connection Hygiene** - Role column migration with backfill, enum cleanup, NpgsqlDataSource unification, and frontend role fix
- [ ] **Phase 4: Input Validation and AI Wrapper Hardening** - FluentValidation on chat and session DTOs, per-API-key rate limiting, and OpenAI resilience
- [ ] **Phase 5: Performance and Scaling** - Chat history pagination and session cache TTL eviction
- [ ] **Phase 6: Test Coverage** - Integration tests for role assignment, session authorization boundary, password reset expiry, and OpenAI error scenarios

## Phase Details

### Phase 1: Exception Infrastructure
**Goal**: All services respond with RFC 7807 ProblemDetails shapes from a typed IExceptionHandler chain; no exception class names leak to API consumers
**Depends on**: Nothing (first phase)
**Requirements**: ERR-01, ERR-02, ERR-03, ERR-04
**Success Criteria** (what must be TRUE):
  1. Auth Service and Chat Service return RFC 7807 ProblemDetails JSON on every error response, matching the shape already used by AI Wrapper
  2. A request that triggers a domain error (e.g., wrong password, duplicate email) receives the correct HTTP status code (401, 409, etc.) rather than 500
  3. No error response includes an `error` field containing a C# exception class name (e.g., `InvalidCredentialsException`)
  4. The React Native frontend error-handling code works correctly with the new ProblemDetails shape (audited before migration begins)
**Plans**: TBD

### Phase 2: Auth Service Security Hardening
**Goal**: User credentials and identity data are protected from log exposure, weak code generation, brute-force enumeration, and expired token bypass
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-08
**Success Criteria** (what must be TRUE):
  1. Auth Service logs show email addresses masked (e.g., `u***r@example.com`) and contain no plaintext 2FA or verification codes
  2. The `verificationcodes` table stores only hashed values with an explicit `ExpiresAt` column; no plaintext codes exist after migration
  3. Submitting 6 incorrect verification codes to `/api/auth/verify-email` from the same email address results in a lockout response
  4. A request to a JWT-protected endpoint using an expired token receives a 401 response
  5. No real API keys or secrets are present in any source-controlled `appsettings.json` file
**Plans**: TBD

### Phase 3: Chat Service Bugs and Connection Hygiene
**Goal**: Chat message roles are stored explicitly in the database and rendered correctly in the frontend; placeholder enum values are replaced; all database access uses the connection pool correctly
**Depends on**: Phase 1
**Requirements**: BUG-01, BUG-02, BUG-03, PERF-01, PERF-02
**Success Criteria** (what must be TRUE):
  1. Each chat message row in the database has an explicit `role` value (`user` or `assistant`); no rows return null role after migration
  2. The React Native frontend renders chat history using the `role` field from the API response rather than inferring role from array position
  3. Chat message status values are `pending`, `delivered`, `error`, or `archived`; no code references `enums.Status.dummy1`
  4. All database connections in Chat Service and Session Service are opened via `_dataSource.OpenConnectionAsync()`; no direct `new NpgsqlConnection()` calls remain
  5. `NpgsqlDataSourceBuilder` configures an explicit `MaxPoolSize` value in the service's DI registration
**Plans**: TBD

### Phase 4: Input Validation and AI Wrapper Hardening
**Goal**: Chat and session inputs are validated before reaching the database; the AI Wrapper enforces per-key rate limits and handles OpenAI outages gracefully
**Depends on**: Phase 1, Phase 3
**Requirements**: SEC-06, SEC-07
**Success Criteria** (what must be TRUE):
  1. Submitting a chat message exceeding 4000 characters returns a 400 validation error with a ProblemDetails response; the message is never written to the database
  2. Submitting a session name exceeding 100 characters returns a 400 validation error
  3. Sending requests to the AI Wrapper using the same `X-Internal-Api-Key` value beyond the configured limit returns 429 responses keyed on that API key, not on the requester's IP address
**Plans**: TBD

### Phase 5: Performance and Scaling
**Goal**: Chat history retrieval is bounded by pagination and session cache entries expire automatically, preventing unbounded memory growth
**Depends on**: Phase 3
**Requirements**: PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. Requesting chat history for a session with more than 50 messages returns the 50 most recent messages and a `hasMore: true` flag; a subsequent request with a cursor returns the next page
  2. Session cache entries expire automatically after 30-60 minutes; a session that has not been accessed within the TTL window is evicted from the cache
**Plans**: TBD

### Phase 6: Test Coverage
**Goal**: Integration tests prove the four critical fixes hold — role assignment correctness, session authorization boundary enforcement, password reset token expiry, and graceful OpenAI error handling
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. An integration test creates a chat session with consecutive messages from the same sender and verifies the returned history has correct `role` values for every message
  2. An integration test authenticates as User A, requests User B's session ID, and receives a 403 or 404 (not a 200 with User B's data)
  3. An integration test creates a password reset code, advances time past the TTL, attempts to use the code, and receives a rejection response
  4. Unit tests verify that 429, 503, and timeout responses from the OpenAI API produce a structured error response to the caller rather than an unhandled exception
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6
Note: Phases 2 and 3 have no dependency on each other and can proceed in parallel.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Exception Infrastructure | 0/TBD | Not started | - |
| 2. Auth Service Security Hardening | 0/TBD | Not started | - |
| 3. Chat Service Bugs and Connection Hygiene | 0/TBD | Not started | - |
| 4. Input Validation and AI Wrapper Hardening | 0/TBD | Not started | - |
| 5. Performance and Scaling | 0/TBD | Not started | - |
| 6. Test Coverage | 0/TBD | Not started | - |
