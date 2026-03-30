---
phase: 5
slug: tech-debt-and-configuration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit (.NET backend), jest-expo (frontend), Docker Compose (infra) |
| **Config file** | Per-service `.Tests.csproj` (all exist from Phase 3) |
| **Quick run command** | `dotnet test auth-service/AuthService.Tests/ -q` |
| **Full suite command** | `dotnet test auth-service/AuthService.Tests/ -q && dotnet test chat-service/ChatService.Tests/ -q && cd frontend && npm test -- --watchAll=false --passWithNoTests` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command for the service being modified
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | CFG-01 | static | `grep -c "communitypass" docker-compose.yml && echo "expect 0"` | ✅ | ⬜ pending |
| 5-01-02 | 01 | 1 | CFG-02 | unit | `dotnet test auth-service/AuthService.Tests/ -q --filter "Health"` | ✅ | ⬜ pending |
| 5-02-01 | 02 | 1 | CFG-03 | unit | `dotnet test notification-service/src/NotificationService.Tests/ -q --filter "Firebase"` | ✅ | ⬜ pending |
| 5-01-03 | 01 | 1 | CFG-04 | static | `grep -c "COMMUNITY_DB_PASSWORD" .env.example && echo "expect >=1"` | ✅ | ⬜ pending |
| 5-02-02 | 02 | 1 | DEBT-02 | static | `grep -r "StoredProcedureExecutor" notification-service/ --include="*.cs" -l` | ✅ | ⬜ pending |
| 5-02-03 | 02 | 1 | DEBT-03 | unit | `cd frontend && npm test -- --watchAll=false --passWithNoTests` | ✅ | ⬜ pending |
| 5-02-04 | 02 | 1 | DEBT-04 | static | `grep -c "SCALING LIMITATION" auth-service/Middleware/RateLimitingMiddleware.cs && echo "expect 1"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. All test projects created in Phase 3.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `docker-compose up` fails fast without env vars | CFG-01 | Requires running Docker Compose without .env | Unset `COMMUNITY_DB_PASSWORD`, run `docker-compose up`, assert error before container starts |
| Auth-service container shows healthy in `docker ps` | CFG-02 | Requires running Docker Compose | Run `docker-compose up`, wait 30s, check `docker ps` for `(healthy)` on auth-service |
| Notification-service fails at startup without Firebase path | CFG-03 | Requires running the service | Set `FIREBASE_SERVICE_ACCOUNT_PATH` to a non-existent file, start notification-service, assert startup failure |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
