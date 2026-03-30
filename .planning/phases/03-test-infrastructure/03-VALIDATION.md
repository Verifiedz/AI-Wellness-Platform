---
phase: 3
slug: test-infrastructure
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-30
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit (.NET backend), jest-expo (frontend) |
| **Config file** | `jest.config.js` (Wave 0 creates), per-service `.Tests.csproj` |
| **Quick run command** | `dotnet test auth-service/AuthService.Tests/ -q` |
| **Full suite command** | `dotnet test auth-service/AuthService.Tests/ -q && dotnet test community-service/CommunityService.Tests/ -q && cd frontend && npm test -- --watchAll=false --passWithNoTests` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command for the service being tested
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | TEST-08 | unit | `dotnet test auth-service/AuthService.Tests/ -q --filter "PasswordHasher"` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | TEST-01 | unit | `dotnet test auth-service/AuthService.Tests/ -q --filter "AuthService"` | ✅ | ⬜ pending |
| 3-02-01 | 02 | 1 | TEST-03 | unit | `dotnet test journal-service/JournalService.Tests/ -q` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | TEST-04 | unit | `dotnet test notification-service/NotificationService.Tests/ -q` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 1 | TEST-05 | unit | `dotnet test chat-service/ChatService.Tests/ -q` | ✅ | ⬜ pending |
| 3-04-01 | 04 | 2 | TEST-06 | unit | `cd frontend && npm test -- --watchAll=false --passWithNoTests` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 2 | TEST-07 | unit | `cd frontend && npm test -- --watchAll=false --testPathPattern=AuthContext` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `auth-service/AuthService.Tests/Services/PasswordHasherTests.cs` — stub for TEST-08 IPasswordHasher (covered by Plan 01 Task 1)
- [x] `journal-service/JournalService.Tests/JournalService.Tests.csproj` — new test project (covered by Plan 02 Task 1)
- [x] `notification-service/NotificationService.Tests/NotificationService.Tests.csproj` — new test project (covered by Plan 03 Task 1)
- [x] `frontend/jest.config.js` — jest-expo configuration (covered by Plan 04 Task 1, configured in package.json)
- [x] `frontend/package.json` devDependencies — jest-expo, @testing-library/react-native (covered by Plan 04 Task 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tests fail against pre-fix code | TEST-01–08 | Requires reverting commits to verify red-green | Code-review the test logic to confirm it tests the fix, not the symptom |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** signed
