# AI Wellness Platform -- Hardening Milestone

## What This Is

A codebase hardening effort for Sakina, a mobile mental wellness app built with React Native/Expo and .NET microservices. The app provides AI-powered chat therapy, journaling with pattern analysis, community support, breathing exercises, and mood tracking. This milestone fixes every concern identified in the codebase audit -- security vulnerabilities, known bugs, tech debt, performance bottlenecks, fragile areas, and test coverage gaps -- so the platform is production-ready for real users and capstone evaluation.

## Core Value

Security first -- fix vulnerabilities and protect user data before anything else. Every fix must include tests proving the concern is resolved.

## Requirements

### Validated

<!-- Shipped and confirmed valuable -- inferred from existing codebase. -->

- ✓ User can register with email/password -- existing (auth-service)
- ✓ User can log in with JWT-based authentication -- existing (auth-service)
- ✓ User can enable and use two-factor authentication -- existing (auth-service + notification-service)
- ✓ User can reset password via email -- existing (auth-service)
- ✓ User can chat with AI wellness assistant -- existing (chat-service + AI-Wrapper-Service)
- ✓ User can manage chat sessions (create, rename, bookmark, delete) -- existing (chat-service)
- ✓ User can view chat history -- existing (chat-service)
- ✓ User can create and edit journal entries -- existing (journal-service)
- ✓ User can view journal pattern analysis and insights -- existing (journal-service)
- ✓ User can export journal data -- existing (journal-service)
- ✓ User can receive push notifications and wellness tips -- existing (notification-service)
- ✓ User can view and post in community feed -- existing (community-service)
- ✓ User can react to community posts -- existing (community-service)
- ✓ User can report community content -- existing (community-service)
- ✓ User can use breathing exercises -- existing (frontend)
- ✓ User can take wellness assessments -- existing (frontend)
- ✓ User can customize theme (dark mode, accent colors) -- existing (frontend)
- ✓ User can access crisis resources -- existing (frontend)
- ✓ App uses API gateway pattern (YARP) for routing -- existing (auth-service)
- ✓ Services use database-per-service isolation -- existing (all services)

### Active

<!-- Current scope: hardening. Fix all concerns from codebase audit. -->

**Security (CRITICAL)**
- [ ] 2FA codes are not logged in plaintext
- [ ] Security codes use cryptographically secure random generation
- [ ] Community service validates gateway shared-secret (not unauthenticated)
- [ ] API key comparisons use timing-safe equality
- [ ] PII is not logged via string interpolation (use structured logging)
- [ ] User info endpoint enforces authorization (users can only query their own data)
- [ ] Exception messages are not exposed to API clients
- [ ] Hardcoded credentials removed from committed config files
- [ ] Hardcoded RunPod proxy URL removed from committed config

**Bugs / Error-Prone Areas (HIGH)**
- [ ] Rate limiting middleware registered in correct order (after CORS and auth)
- [ ] StoredProcedureExecutor validates function names against injection

**Tech Debt (MEDIUM)**
- [ ] Session entity mutations replaced with immutable patterns
- [ ] Chat service naming conventions standardized to PascalCase
- [ ] User-generated content (posts, journals, chat) has input sanitization
- [ ] Auth service uses domain exception types instead of generic Exception
- [ ] Duplicated StoredProcedureExecutor extracted to shared pattern
- [ ] Wearable service stub either implemented or removed from UI

**Performance (MEDIUM)**
- [ ] Chat history queries have pagination (limit/offset)
- [ ] Community posts use fewer database round-trips
- [ ] Chat service propagates CancellationToken through the chain
- [ ] Rate limiting documented as in-memory (scaling limitation noted)

**Test Coverage (HIGH)**
- [ ] Auth service has unit and integration tests
- [ ] Community service has unit and integration tests
- [ ] Journal service has unit and integration tests
- [ ] Notification service has unit and integration tests
- [ ] Chat service test coverage expanded beyond single integration test
- [ ] Frontend has test framework configured (Jest + React Native Testing Library)
- [ ] Frontend critical paths tested (AuthContext, api.js, chatApi.js)

**Configuration / Deployment (LOW)**
- [ ] Docker Compose database ports not exposed to host in production config
- [ ] Auth service container has health check in docker-compose
- [ ] Firebase service account path validated at startup
- [ ] Docker Compose default passwords removed (fail fast if env var missing)
- [ ] .env.example enumerates all required environment variables

### Out of Scope

<!-- Explicit boundaries for this milestone. -->

- New features or functionality -- hardening only, no feature additions
- Upgrading chat-service from .NET 8.0 to 9.0 -- version alignment is a separate milestone
- Unifying Npgsql versions across services -- cosmetic, not a security/correctness issue
- Adding CI/CD pipeline -- valuable but out of scope for hardening
- Adding frontend linting/formatting (ESLint, Prettier) -- quality improvement, not hardening
- Implementing wearable integrations (HealthKit, Health Connect) -- feature work, not hardening
- Redis-backed rate limiting -- in-memory is sufficient for current scale, document limitation
- HTTPS/TLS configuration -- deployment concern, not codebase hardening

## Context

This is a university capstone project that also needs to be production-ready for real users. The codebase was built feature-first across multiple phases (P1-P4) with progressive feature additions. A comprehensive codebase audit identified 15 prioritized concerns across security, bugs, tech debt, performance, and test coverage. The audit findings are documented in `.planning/codebase/CONCERNS.md`.

The platform consists of 6 backend microservices (auth, chat, AI wrapper, notification, journal, community) each with their own PostgreSQL database, plus a React Native/Expo frontend ("Sakina"). The auth-service doubles as the YARP API gateway.

Key context:
- Auth service is the most security-critical service and has zero tests
- Community service has no authentication middleware at all
- 2FA codes are logged in plaintext, defeating multi-factor authentication
- Security codes use predictable `new Random()` instead of cryptographic RNG
- 5 of 6 backend services have zero test projects
- Frontend has no test framework configured

## Constraints

- **Tech stack**: Must stay within existing .NET / React Native / PostgreSQL stack
- **Backwards compatibility**: Database schema changes must be migration-safe (no data loss)
- **Security priority**: Security fixes take precedence over all other categories when conflicts arise
- **No new features**: Hardening only -- no new functionality during this milestone
- **Test with every fix**: Every fix must include a test proving the concern is resolved

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix all CONCERNS.md items, not just critical/high | Capstone needs thorough hardening + real-user readiness | -- Pending |
| Security and test coverage weighted equally | Both critical for capstone evaluation and production use | -- Pending |
| No deadline pressure | Working at own pace allows thoroughness over speed | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after initialization*
