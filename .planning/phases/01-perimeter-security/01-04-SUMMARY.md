---
phase: 01-perimeter-security
plan: "04"
subsystem: config
tags: [security, credentials, config, env]
dependency_graph:
  requires: []
  provides: [sanitized-appsettings, env-example-with-rotation-warnings]
  affects: [community-service, AI-Wrapper-Service, all-services]
tech_stack:
  added: []
  patterns: [env-var-override, empty-placeholder-appsettings]
key_files:
  created:
    - .env.example
  modified:
    - community-service/CommunityService/appsettings.json
    - AI-Wrapper-Service/AIWrapperService/appsettings.json
decisions:
  - "Empty string placeholder in appsettings.json signals env var override required (not removed entirely, keeps schema visible)"
  - "OPENAI_MODEL default kept as 'gpt-4' in .env.example rather than vendor-specific 'wellness-chat:latest'"
metrics:
  duration: 4 minutes
  completed: "2026-03-30T03:12:14Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 01 Plan 04: Credential Scrubbing and .env.example Summary

Removed plaintext credentials from committed config files and created `.env.example` documenting all required environment variables with explicit rotation warnings for credentials whose old values exist in git history.

## Tasks Completed

### Task 1: Remove hardcoded credentials from appsettings.json files (SEC-09 + SEC-10)

**SEC-09 (community-service):** Replaced `Password=postgres` with `Password=` (empty) in `community-service/CommunityService/appsettings.json`. The runtime value is supplied via `ConnectionStrings__CommunityDatabase` env var in docker-compose.yml (`${COMMUNITY_DB_PASSWORD:-communitypass}`).

**SEC-10 (AI-Wrapper-Service):** Replaced `"BaseUrl": "https://a2rvppwc00nk1o-11434.proxy.runpod.net/v1/"` with `"BaseUrl": ""` in `AI-Wrapper-Service/AIWrapperService/appsettings.json`. The runtime value is supplied via `OpenAI__BaseUrl` env var in docker-compose.yml (`${OPENAI_BASE_URL:-https://api.openai.com/v1/}`).

Both replacements use empty-string placeholders rather than deleting the keys, preserving the schema structure and making it clear an override is expected.

**Commit:** 729d874

### Task 2: Create .env.example with rotation warnings (D-06)

Created `.env.example` at the project root with:
- A security warning header identifying credentials with git history exposure
- Explicit rotation notice for `COMMUNITY_DB_PASSWORD` (was: `postgres`) and `OPENAI_BASE_URL` (was: RunPod proxy URL)
- All environment variables referenced in docker-compose.yml as `${VAR_NAME}` patterns
- `COMMUNITY_INTERNAL_API_KEY` variable (added by Plan 03 for community-service gateway auth)
- Reference to `SEC-ADV-03` for future git history scrubbing

**Commit:** 3224abf

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All acceptance criteria confirmed:
- `grep "Password=postgres" community-service/CommunityService/appsettings.json` returns 0 matches
- `grep "runpod.net" AI-Wrapper-Service/AIWrapperService/appsettings.json` returns 0 matches
- `.env.example` exists and contains `COMMUNITY_DB_PASSWORD=<rotate-this-was-postgres>`
- `.env.example` contains `OPENAI_BASE_URL=` with rotation warning comment
- `.env.example` contains `COMMUNITY_INTERNAL_API_KEY=`
- `.env.example` contains "rotate" (2 occurrences) and "git history" (2 occurrences)
- `.env.example` contains `JWT_KEY` and `NOTIFICATION_INTERNAL_API_KEY`
- `CommunityDatabase` key still present in community-service appsettings.json
- `OpenAI` section still present in AI-Wrapper-Service appsettings.json

## Known Stubs

None. This plan only modifies config files and creates documentation. No UI or data flow changes.

## Self-Check: PASSED

Files verified:
- FOUND: /e/Capstone/Code/AI-Wellness-Platform/community-service/CommunityService/appsettings.json
- FOUND: /e/Capstone/Code/AI-Wellness-Platform/AI-Wrapper-Service/AIWrapperService/appsettings.json
- FOUND: /e/Capstone/Code/AI-Wellness-Platform/.env.example

Commits verified:
- 729d874: fix(01-04): remove hardcoded credentials from appsettings.json files
- 3224abf: chore(01-04): create .env.example with rotation warnings
