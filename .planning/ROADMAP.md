# Roadmap: AI Wellness Platform -- Hardening Milestone

## Overview

This roadmap hardens the Sakina platform from feature-complete to production-safe. The work follows a concentric-ring model: secure the authentication perimeter first (auth-service and community-service control access to everything downstream), then fix internal communication vulnerabilities, then establish test infrastructure that proves every security fix cannot silently regress, then address reliability and performance correctness, and finally clean up tech debt and deployment configuration. No new features are introduced -- every phase fixes existing code.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Perimeter Security** - Fix authentication at the gateway boundary (auth-service) and close the completely unauthenticated community-service (completed 2026-03-30)
- [x] **Phase 2: Internal Communication Security** - Fix timing-safe API key comparison, middleware pipeline order, and SQL injection surface on stored procedures (completed 2026-03-30)
- [x] **Phase 3: Test Infrastructure** - Establish test projects for all five untested services and the frontend; write tests proving every Phase 1 and 2 fix (completed 2026-03-30)
- [x] **Phase 4: Reliability and Performance** - Fix pagination, CancellationToken propagation, session immutability, and input sanitization (completed 2026-03-30)
- [ ] **Phase 5: Tech Debt and Configuration** - Clean deployment config, remove dead code, document scaling limitations, consolidate naming conventions

## Phase Details

### Phase 1: Perimeter Security
**Goal**: All six services require authentication, 2FA is cryptographically sound, no credentials or exception details are exposed, and users cannot query other users' data
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, SEC-10
**Success Criteria** (what must be TRUE):
  1. A 2FA code generation request produces a cryptographically unpredictable code and no log entry contains the code value
  2. Any request to community-service without the gateway shared secret receives a 401 response before reaching any controller
  3. A user authenticated as user A cannot retrieve profile data for user B via the user-info endpoint (receives 403)
  4. Exception messages from auth-service failures return a generic error to the API client while full details appear in server logs only
  5. No plaintext credentials or environment-specific URLs appear in committed config files
**Plans:** 5/5 plans complete
Plans:
- [x] 01-01-PLAN.md -- Domain exception hierarchy and exception exposure fix (SEC-08, SEC-07)
- [x] 01-02-PLAN.md -- CSPRNG for 2FA, structured logging, endpoint removal (SEC-01, SEC-02, SEC-05, SEC-06)
- [x] 01-03-PLAN.md -- Community service gateway authentication middleware (SEC-03)
- [x] 01-04-PLAN.md -- Credential scrubbing and .env.example (SEC-09, SEC-10)

### Phase 2: Internal Communication Security
**Goal**: Internal service-to-service communication is resistant to timing attacks, the middleware pipeline processes requests in the correct order, and stored procedure calls cannot be exploited via function name injection
**Depends on**: Phase 1
**Requirements**: SEC-04, REL-01, REL-02
**Success Criteria** (what must be TRUE):
  1. Notification-service API key comparison uses constant-time equality and a timing measurement test confirms no measurable difference between valid and invalid key response times
  2. A CORS preflight request to auth-service receives a 200 response (not 429) confirming rate limiting executes after CORS handling
  3. Passing a function name containing SQL metacharacters to StoredProcedureExecutor causes immediate rejection before any database call
**Plans:** 2/2 plans complete
Plans:
- [x] 02-01-PLAN.md -- Timing-safe API key comparison and middleware pipeline reorder (SEC-04, REL-01)
- [x] 02-02-PLAN.md -- StoredProcedureExecutor function name validation (REL-02)

### Phase 3: Test Infrastructure
**Goal**: Every previously untested service (auth, community, journal, notification, chat) has a test project, the frontend has Jest configured, and tests exist that verify each Phase 1 and 2 security fix cannot silently regress
**Depends on**: Phase 2
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08
**Success Criteria** (what must be TRUE):
  1. Running `dotnet test` across all backend services passes with auth-service reaching 80%+ coverage on security paths (CSPRNG, 2FA log absence, GetUserInfo authorization, duplicate-email error shape)
  2. Community-service tests include a test that sends a request without the gateway shared secret and asserts 401
  3. Frontend `npm test` runs without configuration errors and AuthContext login, logout, and token-restore flows have passing tests
  4. All tests were written to fail against the pre-fix code and pass only after the fix (no characterization tests encoding broken behavior)
**Plans:** 4/4 plans complete
Plans:
- [x] 03-01-PLAN.md -- IPasswordHasher abstraction and auth-service test expansion (TEST-08, TEST-01)
- [x] 03-02-PLAN.md -- Community-service controller tests and journal-service test project (TEST-02, TEST-03)
- [x] 03-03-PLAN.md -- Notification-service test project and chat-service test expansion (TEST-04, TEST-05)
- [x] 03-04-PLAN.md -- Frontend Jest configuration and AuthContext/api/chatApi tests (TEST-06, TEST-07)

### Phase 4: Reliability and Performance
**Goal**: Chat history queries are bounded by pagination, abandoned AI requests are cancelled promptly, session state is never mutated in place, and user-generated content is sanitized before storage
**Depends on**: Phase 3
**Requirements**: REL-03, REL-04, REL-05, REL-06
**Success Criteria** (what must be TRUE):
  1. A chat history request with `limit=20&offset=0` returns at most 20 messages and a follow-up request with `offset=20` returns the next page
  2. Disconnecting a client mid-request causes the chat-service to cancel the in-flight OpenAI API call within one second (observable via cancellation log entry)
  3. Session rename and bookmark operations return new session objects without mutating the original entity in memory
  4. Submitting a community post or journal entry with an HTML script tag stores the sanitized text, not the raw HTML
**Plans:** 3/3 plans complete
Plans:
- [x] 04-01-PLAN.md -- Chat pagination and CancellationToken propagation (REL-03, REL-04)
- [x] 04-02-PLAN.md -- Session entity immutability (REL-06)
- [x] 04-03-PLAN.md -- HTML sanitization for user-generated content (REL-05)

### Phase 5: Tech Debt and Configuration
**Goal**: Docker Compose fails fast on missing credentials, all required environment variables are documented, dead code is removed, and naming conventions and scaling limitations are accurately reflected in the codebase
**Depends on**: Phase 4
**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04, DEBT-01, DEBT-02, DEBT-03, DEBT-04
**Success Criteria** (what must be TRUE):
  1. Running `docker-compose up` without required environment variables set fails immediately with a clear error message (does not start with default passwords)
  2. The auth-service container reports healthy in `docker ps` output after startup
  3. Starting notification-service without a valid Firebase service account path fails at startup with a descriptive error before accepting any requests
  4. The wearable service is either fully absent from the UI or displays a "coming soon" state with no dead service calls
**Plans:** 2/3 plans executed
Plans:
- [x] 05-01-PLAN.md -- Docker config hardening and .env.example completion (CFG-01, CFG-02, CFG-04)
- [x] 05-02-PLAN.md -- Firebase fail-fast, duplication docs, rate limit docs, wearable coming-soon (CFG-03, DEBT-02, DEBT-03, DEBT-04)
- [x] 05-03-PLAN.md -- Chat service PascalCase naming standardization (DEBT-01)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Perimeter Security | 5/5 | Complete   | 2026-03-30 |
| 2. Internal Communication Security | 2/2 | Complete    | 2026-03-30 |
| 3. Test Infrastructure | 4/4 | Complete   | 2026-03-30 |
| 4. Reliability and Performance | 3/3 | Complete    | 2026-03-30 |
| 5. Tech Debt and Configuration | 2/3 | In Progress|  |
