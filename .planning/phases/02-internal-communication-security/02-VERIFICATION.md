---
phase: 02-internal-communication-security
verified: 2026-03-30T06:30:00Z
status: human_needed
score: 4/5 must-haves verified
human_verification:
  - test: "Timing measurement: measure response time of notification-service /api/notifications/send-code with a valid API key versus an invalid API key. Use a tool such as wrk, k6, or a BenchmarkDotNet harness to gather 1000+ samples each."
    expected: "Mean response times for valid and invalid keys are statistically indistinguishable (within noise), confirming constant-time behaviour of CryptographicOperations.FixedTimeEquals."
    why_human: "No automated timing benchmark exists in the codebase. The ROADMAP success criterion explicitly requires a timing measurement test, but the VALIDATION.md deferred this to manual verification citing BenchmarkDotNet as 'heavy'. The code change (using FixedTimeEquals) is correct and verified; only the empirical timing proof is missing from automated tests."
  - test: "CORS preflight: send an OPTIONS request to any auth-service endpoint (e.g., OPTIONS http://localhost:5051/api/auth/login with Origin: http://localhost:3000 and the Access-Control-Request-Method header) and verify the response status is 200, not 429."
    expected: "Response is 200 with CORS headers present, confirming the preflight is handled by CORS middleware before the rate limiter counts it."
    why_human: "The middleware order regression test uses source-code static analysis (reads Program.cs as a string) and verifies correct ordering at the text level. It does not boot a test server and issue an actual OPTIONS request. Functional confirmation that a preflight is not rate-limited requires a running service."
---

# Phase 2: Internal Communication Security — Verification Report

**Phase Goal:** Internal service-to-service communication is resistant to timing attacks, the middleware pipeline processes requests in the correct order, and stored procedure calls cannot be exploited via function name injection
**Verified:** 2026-03-30T06:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Notification-service API key comparison uses CryptographicOperations.FixedTimeEquals instead of string equality | VERIFIED | NotificationCodeController.cs line 109 calls `CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes)`; old `expectedKey == providedKey` pattern absent; usings for `System.Security.Cryptography` and `System.Text` present at lines 3-4 |
| 2 | Auth-service middleware pipeline runs CORS before rate limiting so OPTIONS preflights get 200 not 429 | VERIFIED (code) / ? HUMAN (runtime) | Program.cs: UseCors at line 133, UseAuthentication at 135, UseAuthorization at 136, UseRateLimiting at 138. Order is correct. RateLimitingOrderTests.cs verifies via source-code static analysis. Runtime preflight behaviour needs human confirmation (see Human Verification Required). |
| 3 | Passing a function name containing SQL metacharacters to StoredProcedureExecutor causes immediate ArgumentException before any database call | VERIFIED | Both StoredProcedureExecutor files contain `ValidateFunctionName(procedureName)` as the first statement in all four public methods (ExecuteScalarAsync, ExecuteReaderAsync, ExecuteNonQueryAsync, ExecuteSingleAsync). 30 unit tests in StoredProcedureValidationTests.cs pass (per SUMMARY). |
| 4 | All legitimate stored procedure names (letters, digits, underscores) continue to work without rejection | VERIFIED | StoredProcedureValidationTests.cs contains Theory tests accepting: sp_get_notifications, sp_log_notification_attempt, sp_check_notification_sent_today, sp_acquire_notification_job_lock, sp_release_notification_job_lock, sp_create_assessment, sp_get_assessments, sp_get_latest_assessment, sp_log_escalation, sp_delete_journal_entry. |
| 5 | Timing measurement test confirms no measurable difference between valid and invalid key response times | NOT MET | No BenchmarkDotNet, Stopwatch, or k6 test exists in the codebase. ROADMAP success criterion 1 explicitly requires this. VALIDATION.md defers to manual verification. Code correctness (using FixedTimeEquals) is verified; empirical timing proof is absent from automated tests. |

**Score:** 4/5 truths automated-verified (Truth #2 partially — code correct, runtime behaviour needs human; Truth #5 deferred to human per VALIDATION.md)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `notification-service/src/NotificationService.Api/Controller/NotificationCodeController.cs` | Timing-safe ValidateApiKey method with CryptographicOperations.FixedTimeEquals | VERIFIED | File exists, line 109 contains `CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes)`. Empty-key early-return guard at line 103. Dev bypass (`if (!requireSecret) return true`) preserved at line 97-98. Old string equality `expectedKey == providedKey` absent. |
| `auth-service/Program.cs` | Correct middleware registration order: ExceptionHandling -> CORS -> Auth -> Authz -> RateLimit | VERIFIED | Line 131: UseMiddleware<ExceptionHandlingMiddleware>, Line 133: UseCors("AllowFrontend"), Line 135: UseAuthentication(), Line 136: UseAuthorization(), Line 138: UseRateLimiting(). Order matches the required plan. |
| `auth-service/AuthService.Tests/Middleware/RateLimitingOrderTests.cs` | Test proving middleware order is correct; contains MiddlewareOrder | VERIFIED | File exists, contains two tests: `MiddlewareOrder_CorsRegisteredBeforeRateLimiting` and `MiddlewareOrder_AuthenticationRegisteredBeforeRateLimiting`. Both read Program.cs source and assert positional ordering. |
| `notification-service/src/NotificationService.Api/Infrastructure/StoredProcedureExecutor.cs` | SQL identifier validation guard; contains ValidateFunctionName | VERIFIED | File exists; `ValidateFunctionName` private static method at lines 28-36; Regex `^[a-zA-Z_][a-zA-Z0-9_]*\z` (using `\z` not `$`, correctly blocking trailing newlines); called 4 times (grep -c confirmed). using System.Text.RegularExpressions present at line 5. |
| `journal-service/src/JournalService.Api/Infrastructure/StoredProcedureExecutor.cs` | SQL identifier validation guard; contains ValidateFunctionName | VERIFIED | File exists; identical ValidateFunctionName implementation at lines 24-32; Regex `^[a-zA-Z_][a-zA-Z0-9_]*\z`; called 4 times (grep -c confirmed). using System.Text.RegularExpressions present at line 5. |
| `auth-service/AuthService.Tests/Services/StoredProcedureValidationTests.cs` | Tests proving SQL injection via function name is blocked; contains StoredProcedure | VERIFIED | File exists; `StoredProcedureNameValidation_AcceptsValidIdentifiers` (13 valid names as Theory data); `StoredProcedureNameValidation_RejectsInvalidIdentifiers` (16 injection vectors as Theory data); `StoredProcedureNameValidation_NullThrowsOnRegexMatch`. Regex in test file uses `\z` anchor (consistent with executor). |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| NotificationCodeController.ValidateApiKey | System.Security.Cryptography.CryptographicOperations | FixedTimeEquals call at line 109 | WIRED | Call site: `return CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);` |
| auth-service/Program.cs | UseCors before UseRateLimiting | Middleware registration order | WIRED | UseCors at line 133, UseRateLimiting at line 138. IndexOf("UseCors") < IndexOf("UseRateLimiting") confirmed. |
| notification-service StoredProcedureExecutor.ExecuteScalarAsync | ValidateFunctionName | Guard call at method entry | WIRED | Line 61: `ValidateFunctionName(procedureName);` as first statement in try block |
| notification-service StoredProcedureExecutor.ExecuteReaderAsync | ValidateFunctionName | Guard call at method entry | WIRED | Line 110: `ValidateFunctionName(procedureName);` as first statement in try block |
| notification-service StoredProcedureExecutor.ExecuteNonQueryAsync | ValidateFunctionName | Guard call at method entry | WIRED | Line 155: `ValidateFunctionName(procedureName);` as first statement in try block |
| notification-service StoredProcedureExecutor.ExecuteSingleAsync | ValidateFunctionName | Guard call at method entry | WIRED | Line 201: `ValidateFunctionName(procedureName);` as first statement in try block |
| journal-service StoredProcedureExecutor.ExecuteScalarAsync | ValidateFunctionName | Guard call at method entry | WIRED | Line 47: `ValidateFunctionName(procedureName);` as first statement in try block |
| journal-service StoredProcedureExecutor.ExecuteReaderAsync | ValidateFunctionName | Guard call at method entry | WIRED | Line 86: `ValidateFunctionName(procedureName);` as first statement in try block |
| journal-service StoredProcedureExecutor.ExecuteNonQueryAsync | ValidateFunctionName | Guard call at method entry | WIRED | Line 123: `ValidateFunctionName(procedureName);` as first statement in try block |
| journal-service StoredProcedureExecutor.ExecuteSingleAsync | ValidateFunctionName | Guard call at method entry | WIRED | Line 159: `ValidateFunctionName(procedureName);` as first statement in try block |

---

### Data-Flow Trace (Level 4)

Not applicable. This phase produces security hardening guards (middleware reordering, constant-time comparison, input validation), not components that render dynamic data. No data-flow trace is warranted.

---

### Behavioral Spot-Checks

Step 7b applies only to runnable code. The three test files are the primary verifiable outputs. Running the full test suite is the appropriate spot-check.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| ValidateFunctionName called 4 times in notification-service executor | `grep -c "ValidateFunctionName(procedureName)" notification-service/.../StoredProcedureExecutor.cs` | 4 | PASS |
| ValidateFunctionName called 4 times in journal-service executor | `grep -c "ValidateFunctionName(procedureName)" journal-service/.../StoredProcedureExecutor.cs` | 4 | PASS |
| String equality absent from NotificationCodeController | `grep "expectedKey == providedKey"` returns nothing | No match (exit 1) | PASS |
| Middleware order: UseCors line 133, UseRateLimiting line 138 | grep line numbers in Program.cs | Lines 133 and 138 confirmed | PASS |
| Regex uses `\z` anchor (not `$`) in both executors | grep for `\z` | Found in both files | PASS |
| All 4 commits from summaries exist in git log | `git log --oneline` | 0e0fa69, 657c93d, 7d66544, f2e95d8 all present | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SEC-04 | 02-01-PLAN.md | API key comparison in notification-service uses timing-safe equality (CryptographicOperations.FixedTimeEquals) | SATISFIED | NotificationCodeController.cs line 109 uses FixedTimeEquals; old string equality absent; usings present |
| REL-01 | 02-01-PLAN.md | Rate limiting middleware registered in correct order (after CORS and authentication) | SATISFIED | Program.cs: CORS at 133, Auth at 135, Authz at 136, RateLimit at 138; two regression tests in RateLimitingOrderTests.cs |
| REL-02 | 02-02-PLAN.md | StoredProcedureExecutor validates function names against allowed character pattern | SATISFIED | Both executors contain ValidateFunctionName with `\z`-anchored regex; guard called in all 4 public methods; 30 tests covering acceptance and rejection cases |

**All three Phase 2 requirements (SEC-04, REL-01, REL-02) are satisfied.** REQUIREMENTS.md traceability table marks all three as Complete for Phase 2. No orphaned requirements found — REQUIREMENTS.md assigns no additional Phase 2 IDs beyond these three.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | All modified files contain substantive implementations with no stubs, placeholders, or empty handlers | — | — |

Notable observations:
- NotificationCodeController.cs: The `if (!requireSecret) return true` dev bypass is intentional and documented in the plan. It is not a security hole — it is gated by a configuration flag and appropriate for development use.
- StoredProcedureValidationTests.cs: The test file tests the regex pattern independently rather than calling into the actual executor. This is a consciously documented deviation in the SUMMARY (notification-service and journal-service have no test projects in this phase). The regex is byte-for-byte identical between executor implementations and the test, so drift risk is low but non-zero.
- RateLimitingOrderTests.cs: The test reads Program.cs as a raw string and uses `IndexOf`. This is a static analysis test, not a runtime test. It cannot detect runtime middleware execution order (e.g., if UseRateLimiting is conditionally registered). For the current codebase structure this is acceptable, and the PLAN/SUMMARY explicitly documents the trade-off.

---

### Human Verification Required

#### 1. Empirical Timing Oracle Test (SEC-04 / ROADMAP Success Criterion 1)

**Test:** Using a benchmarking tool (k6, wrk, BenchmarkDotNet harness, or repeated curl with time measurement), issue at least 1,000 requests to `POST /api/notifications/send-code` with a valid `X-Internal-Api-Key` header, and at least 1,000 requests with an invalid key. Compute mean and standard deviation for each group.

**Expected:** Mean response times for valid and invalid keys are statistically indistinguishable (within measurement noise, typically < 1ms difference on localhost). This confirms `CryptographicOperations.FixedTimeEquals` provides constant-time behaviour.

**Why human:** No BenchmarkDotNet, Stopwatch, or k6 test exists in the codebase. The VALIDATION.md explicitly defers this to manual verification. The code change itself (using FixedTimeEquals) is correct and verified, but the ROADMAP's Success Criterion 1 specifically states "a timing measurement test confirms no measurable difference." The empirical proof is missing from the automated test suite.

#### 2. CORS Preflight Functional Test (REL-01 / ROADMAP Success Criterion 2)

**Test:** Start auth-service locally (`dotnet run` in `auth-service/`) and issue:
```
OPTIONS http://localhost:5051/api/auth/login
Origin: http://localhost:3000
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type, Authorization
```

**Expected:** Response status is 200 (not 429). Response includes `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` headers. If repeated rapidly (trigger rate limiting threshold), subsequent OPTIONS requests still return 200, not 429.

**Why human:** The regression test in `RateLimitingOrderTests.cs` uses static analysis (IndexOf on Program.cs source text) and does not start a server. It verifies the code order is correct but cannot prove the runtime execution order. ROADMAP Success Criterion 2 requires a 200 response confirmation from an actual preflight request.

---

### Gaps Summary

No code-level gaps. All five required artifacts exist, are substantive, and are correctly wired. All three phase requirements (SEC-04, REL-01, REL-02) are satisfied by the code changes.

Two items require human confirmation to fully satisfy the ROADMAP success criteria as written:

1. **ROADMAP Success Criterion 1** says "a timing measurement test confirms no measurable difference." The automated proof is absent — only the correct code change (FixedTimeEquals) is present. This was deliberately deferred to manual verification per VALIDATION.md. Human needed to run the benchmark and confirm.

2. **ROADMAP Success Criterion 2** says "A CORS preflight request to auth-service receives a 200 response (not 429)." The code order is provably correct. A running-server confirmation would close this completely.

Both are human verification items, not code bugs. The phase code is correct and complete.

---

_Verified: 2026-03-30T06:30:00Z_
_Verifier: Claude (gsd-verifier)_
