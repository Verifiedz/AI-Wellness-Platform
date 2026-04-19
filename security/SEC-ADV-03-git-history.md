# SEC-ADV-03 — Git history scrub vs rotate-only

**Status:** Accepted — rotate-only
**Date:** 2026-04-18
**Owner:** Sakina platform security
**Related:** `.env.example`, `security/secret-rotation.md`

## Context

Early in the project two secrets were committed to `docker-compose.yml` /
service config and subsequently moved to environment variables:

1. `COMMUNITY_DB_PASSWORD` — committed as the literal `postgres`.
2. `OPENAI_BASE_URL` — committed as a RunPod proxy URL
   (`https://a2rvppwc00nk1o-11434.proxy.runpod.net/v1/`).

`.env.example` has a "SECURITY WARNING" banner acknowledging both and marked
history scrubbing as a future milestone. App-store readiness forces us to
close the loop: either scrub the history or formally accept it and rotate.

## Options considered

### Option A — Scrub history (`git filter-repo` / BFG)

Rewrites every commit that touched the leaked strings, producing a new DAG.

Pros
* Public clones cloned after the rewrite no longer contain the secrets.
* Satisfies the strictest interpretation of "remove the credential from the
  artifact".

Cons
* Every existing clone, fork, and mirror still contains the old history.
  GitHub keeps unreferenced blobs reachable for up to 90 days; aggressive
  callers (search engines, mirrors, secret scanners) may have already
  archived them.
* Every active contributor must `git fetch --all` + re-clone; any in-flight
  branches must be rebased against the rewritten base. For a small team
  this is survivable; for Sakina's Capstone timeline it is another week of
  coordination.
* CI caches and lockfiles keyed on commit SHA are invalidated.
* It does not rotate the secret — the original `postgres` password and
  RunPod URL remain valid wherever they were reused, so rotation is
  **still required**.
* It creates a false sense of security. Auditors treat "we rewrote history"
  as lower assurance than "we rotated and the old value no longer works".

### Option B — Rotate-only (accepted)

Treat the git history as public, rotate every leaked secret, and prevent
recurrence with secret scanning + pre-commit hooks.

Pros
* Directly addresses the actual threat: a leaked secret is only dangerous
  for as long as it authenticates. Rotation makes the cleartext in history
  valueless.
* Zero coordination cost for contributors.
* Preserves commit history, blame, and CI build attribution.
* Aligns with the GitHub / Google / OWASP recommended response to a leaked
  credential: rotate first, rewrite only if contractually required.

Cons
* The strings themselves remain visible. For a reader-only repository this
  is acceptable; for a repo with regulatory obligations around past
  disclosure (PCI, HIPAA) it would not be.

## Decision

**Adopt Option B.** Rotation is mandatory; history rewrite is not pursued.

## Action items

1. Execute the rotation runbook at `security/secret-rotation.md`.
   Tracked as part of the Week 2 plan in the app-store-readiness doc.
2. Add a CI secret-scan step (gitleaks) on every PR so future leaks are
   caught at review time, not after merge.
3. Update `.env.example` to remove the "future milestone" language — the
   milestone is this document.
4. Keep this ADR checked in so the next auditor or contributor finds it
   before asking "why didn't you scrub?".

## Revisit criteria

Re-open this decision and move to Option A if any of the following become
true:

* A regulator or enterprise customer contractually requires the literal
  removal of the leaked strings.
* A secret with **non-rotatable** value (e.g. a signed app-review token,
  a personal identifier) is committed in the future.
* A contributor without clone access requests provenance that cannot be
  provided while the strings remain in history.
