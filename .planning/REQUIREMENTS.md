# Requirements: AI Wellness Platform -- Hardening Milestone

**Defined:** 2026-03-29
**Core Value:** Security first -- fix vulnerabilities and protect user data before anything else. Every fix must include tests proving the concern is resolved.

## v1 Requirements

Requirements for hardening milestone. Each maps to roadmap phases.

### Security

- [x] **SEC-01**: 2FA codes are not logged in plaintext (remove log statement in auth-service AuthService.cs)
- [x] **SEC-02**: Security codes use cryptographically secure random generation (replace `new Random()` with `RandomNumberGenerator`)
- [x] **SEC-03**: Community service validates gateway shared-secret before processing requests
- [x] **SEC-04**: API key comparison in notification-service uses timing-safe equality (`CryptographicOperations.FixedTimeEquals`)
- [x] **SEC-05**: PII removed from log string interpolation in auth-service (convert to structured logging placeholders)
- [x] **SEC-06**: User info endpoint enforces authorization (users can only query their own data)
- [x] **SEC-07**: Exception messages are not exposed to API clients (return generic errors, log details server-side)
- [x] **SEC-08**: Auth service uses domain exception types instead of generic `Exception` (prerequisite for SEC-07)
- [x] **SEC-09**: Hardcoded credentials removed from committed config files (community-service appsettings.json)
- [x] **SEC-10**: Hardcoded RunPod proxy URL removed from committed config (AI-Wrapper-Service appsettings.json)

### Testing

- [x] **TEST-01**: Auth service has unit and integration test project with tests covering auth flows, JWT, and password validation
- [x] **TEST-02**: Community service has test project with tests covering post CRUD, reactions, and authentication middleware
- [x] **TEST-03**: Journal service has test project with tests covering journal CRUD and pattern analysis
- [x] **TEST-04**: Notification service has test project with tests covering code delivery, push notifications, and scheduling
- [x] **TEST-05**: Chat service test coverage expanded to include SessionService, ChatController, and wrapper client
- [x] **TEST-06**: Frontend test framework configured (Jest + React Native Testing Library)
- [x] **TEST-07**: Frontend critical paths tested (AuthContext, api.js, chatApi.js)
- [x] **TEST-08**: IPasswordHasher abstraction introduced in auth-service for testable password hashing

### Reliability

- [x] **REL-01**: Rate limiting middleware registered in correct order (after CORS and authentication)
- [x] **REL-02**: StoredProcedureExecutor validates function names against allowed character pattern
- [x] **REL-03**: Chat history queries have pagination support (limit/offset parameters)
- [x] **REL-04**: CancellationToken propagated through chat service controller-service-provider chain
- [ ] **REL-05**: User-generated content (posts, journals, chat) has input sanitization at storage boundary
- [x] **REL-06**: Session entity mutations replaced with immutable patterns (use `with` expressions or new objects)

### Configuration

- [ ] **CFG-01**: Docker Compose database passwords fail fast when env vars missing (no default fallbacks)
- [ ] **CFG-02**: Auth service container has health check directive in docker-compose.yml
- [ ] **CFG-03**: Firebase service account path validated at startup with clear error if missing
- [ ] **CFG-04**: .env.example enumerates all required environment variables with placeholder values

### Tech Debt

- [ ] **DEBT-01**: Chat service naming conventions standardized to PascalCase per .NET conventions
- [ ] **DEBT-02**: Duplicated StoredProcedureExecutor consolidated (shared project reference or extracted pattern)
- [ ] **DEBT-03**: Wearable service stub removed from UI or marked as coming-soon placeholder
- [ ] **DEBT-04**: In-memory rate limiting scaling limitation documented in architecture docs

## v2 Requirements

Deferred to future milestones. Not in current roadmap.

### Infrastructure

- **INFRA-01**: CI/CD pipeline with automated testing on PR
- **INFRA-02**: Frontend linting and formatting enforcement (ESLint + Prettier)
- **INFRA-03**: Chat service upgraded from .NET 8.0 to 9.0
- **INFRA-04**: Npgsql versions unified across all services
- **INFRA-05**: NuGet lock files added for reproducible builds
- **INFRA-06**: TypeScript properly configured in frontend (tsconfig.json)

### Security (Advanced)

- **SEC-ADV-01**: Redis-backed rate limiting for multi-instance scaling
- **SEC-ADV-02**: HTTPS/TLS termination configuration
- **SEC-ADV-03**: Git history scrubbing for previously committed secrets
- **SEC-ADV-04**: Security static analysis (Roslyn analyzers) integrated into build

### Testing (Advanced)

- **TEST-ADV-01**: Testcontainers for real PostgreSQL in integration tests
- **TEST-ADV-02**: Code coverage gates (80%+ enforced)
- **TEST-ADV-03**: E2E test suite for critical user flows

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New features or functionality | Hardening only -- no feature additions this milestone |
| .NET 8 to 9 upgrade for chat-service | Version alignment is a separate milestone |
| Npgsql version unification | Cosmetic, not a security/correctness issue |
| CI/CD pipeline setup | Valuable but out of scope for hardening |
| Frontend linting/formatting | Quality improvement, not hardening |
| Wearable integrations (HealthKit, Health Connect) | Feature work, not hardening |
| Redis-backed rate limiting | In-memory sufficient for current scale |
| HTTPS/TLS configuration | Deployment concern, not codebase hardening |
| ORM migration (Dapper -> EF Core) | Architecture change, not hardening |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 2 | Complete |
| SEC-05 | Phase 1 | Complete |
| SEC-06 | Phase 1 | Complete |
| SEC-07 | Phase 1 | Complete |
| SEC-08 | Phase 1 | Complete |
| SEC-09 | Phase 1 | Complete |
| SEC-10 | Phase 1 | Complete |
| TEST-01 | Phase 3 | Complete |
| TEST-02 | Phase 3 | Complete |
| TEST-03 | Phase 3 | Complete |
| TEST-04 | Phase 3 | Complete |
| TEST-05 | Phase 3 | Complete |
| TEST-06 | Phase 3 | Complete |
| TEST-07 | Phase 3 | Complete |
| TEST-08 | Phase 3 | Complete |
| REL-01 | Phase 2 | Complete |
| REL-02 | Phase 2 | Complete |
| REL-03 | Phase 4 | Complete |
| REL-04 | Phase 4 | Complete |
| REL-05 | Phase 4 | Pending |
| REL-06 | Phase 4 | Complete |
| CFG-01 | Phase 5 | Pending |
| CFG-02 | Phase 5 | Pending |
| CFG-03 | Phase 5 | Pending |
| CFG-04 | Phase 5 | Pending |
| DEBT-01 | Phase 5 | Pending |
| DEBT-02 | Phase 5 | Pending |
| DEBT-03 | Phase 5 | Pending |
| DEBT-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after roadmap creation -- all 32 requirements mapped*
