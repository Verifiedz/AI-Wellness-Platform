# AI Wellness Platform — Hardening Milestone

## What This Is

A codebase hardening effort for the AI Wellness Platform — a mobile mental wellness app with AI chat, journaling, and authentication. This milestone addresses all concerns identified in the codebase audit: security vulnerabilities, known bugs, tech debt, performance bottlenecks, fragile areas, and test coverage gaps.

## Core Value

Security first — fix vulnerabilities and protect user data before anything else. Every fix must include tests proving the concern is resolved.

## Requirements

### Validated

- Auth flow (login, register, 2FA, password reset) — existing
- AI chat with session management and history — existing
- JWT-based authentication with YARP gateway — existing
- Redis session caching — existing
- React Native/Expo mobile frontend — existing

### Active

- [ ] Fix all 6 security vulnerabilities (log masking, rate limiting, key management, code hashing, input validation, brute-force protection)
- [ ] Fix all 3 known bugs (chat role assignment, weak verification codes, JWT expiry enforcement)
- [ ] Resolve all 4 tech debt items (generic exceptions, connection management, stored procedure names, placeholder enums)
- [ ] Address all 3 performance bottlenecks (history deserialization, N+1 queries, connection pooling)
- [ ] Stabilize all 4 fragile areas (role detection, DB connections, exception handling, password reset)
- [ ] Resolve all 3 scaling limits (cache expiration, chat pagination, model configurability)
- [ ] Fill all 4 test coverage gaps (role assignment, session auth boundary, OpenAI errors, reset token expiry)

### Out of Scope

- New features (auth, chat, journal, or UI) — this is hardening only
- Database migration to a different DBMS — staying with PostgreSQL
- Frontend redesign — only fix frontend code directly tied to backend bugs (e.g., role assignment)
- Infrastructure/deployment changes — focus is on application code

## Context

- Capstone project with microservices architecture: Auth Service, Chat Service, AI Wrapper Service
- Stack: .NET 8/9 backends, React Native/Expo frontend, PostgreSQL, Redis
- Codebase audit completed 2026-03-25 with detailed concerns documented in `.planning/codebase/CONCERNS.md`
- Chat session management feature recently shipped (current branch: `chat-session-management`)
- Existing test infrastructure: xUnit, Moq, FluentAssertions, coverlet

## Constraints

- **Tech stack**: Must stay within existing .NET / React Native / PostgreSQL stack
- **Backwards compatibility**: Database schema changes must be migration-safe (no data loss)
- **Security priority**: Security fixes take precedence over all other categories when conflicts arise

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Security-first ordering | User data protection is non-negotiable for a wellness app | -- Pending |
| Tests accompany every fix | Prevents regressions and proves concerns are resolved | -- Pending |
| All concerns in scope | Comprehensive hardening before adding features | -- Pending |

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
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*
