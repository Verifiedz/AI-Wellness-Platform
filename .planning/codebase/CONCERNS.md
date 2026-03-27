# Codebase Concerns

**Analysis Date:** 2026-03-25

## Tech Debt

**Generic Exception Handling:**
- Issue: Services use generic `throw new Exception()` for domain errors (27 instances in auth-service alone)
- Files: `auth-service/Services/AuthService.cs`, `chat-service/ChatService/Services/chatService.cs`, `chat-service/ChatService/Services/SessionService.cs`
- Impact: Inability to distinguish between validation errors, authorization errors, and system failures at the API boundary. Makes client error handling brittle.
- Fix approach: Create domain-specific exception types (e.g., `PasswordValidationException`, `DuplicateEmailException`, `SessionAccessDeniedException`). Map these to appropriate HTTP status codes in middleware.

**Inconsistent Database Connection Management:**
- Issue: `ChatDatabaseProvider.cs` creates new `NpgsqlConnection` instances directly (lines 32, 52, 64) instead of consistently using injected `_dataSource`
- Files: `chat-service/ChatService/APIs/Providers/ChatDatabaseProvider.cs` (lines 31-32, 50-53, 64, 90)
- Impact: Resource leaks, connection pool exhaustion under load, inconsistent connection lifecycle management
- Fix approach: Use `_dataSource.OpenConnectionAsync()` exclusively (already correctly used on line 91). Remove direct `NpgsqlConnection` instantiation. Ensure all connections use connection pooling via datasource.

**Hardcoded Stored Procedure Names with No Validation at Runtime:**
- Issue: Dictionary mappings for stored procedures have no type safety or validation (e.g., `SessionDatabaseProvider.cs` lines 13-20, `ChatDatabaseProvider.cs` lines 14-21)
- Files: `chat-service/ChatService/APIs/Providers/SessionDatabaseProvider.cs`, `chat-service/ChatService/APIs/Providers/ChatDatabaseProvider.cs`
- Impact: Typos in procedure names only caught at runtime. No compile-time verification that procedures exist in database.
- Fix approach: Consider using Dapper or EF Core queryable patterns with compile-time checking, or generate procedure name constants from SQL scripts.

**Placeholder Status Enum Values:**
- Issue: Chat messages use hardcoded `enums.Status.dummy1` (lines 93, 126 in `chatService.cs`)
- Files: `chat-service/ChatService/Services/chatService.cs`
- Impact: Chat history cannot be queried or filtered by real status. Messages are permanently marked as placeholder.
- Fix approach: Define proper status enum values (e.g., `pending`, `delivered`, `error`, `archived`) and populate meaningfully based on chat state.

## Known Bugs

**Chat History Role Assignment Logic is Fragile:**
- Symptoms: Chat history alternates roles by array index (`index % 2 == 0 ? "user" : "assistant"`) on line 46 of `chatService.cs`, then frontend re-determines roles on line 34 of `chatApi.js`
- Files: `chat-service/ChatService/Services/chatService.cs` (lines 44-48), `frontend/src/services/chatApi.js` (lines 32-37)
- Trigger: Can reproduce by retrieving chat history when consecutive messages are from same sender
- Workaround: None - history will incorrectly label messages
- Fix approach: Store message sender/role in database, don't infer from position. Populate `Chat` entity with role field derived from `chatUserId`.

**Password Validation Double-Code Generation:**
- Symptoms: `GenerateRandomCode()` in `AuthService.cs` (lines 290-294) generates weak 6-digit codes without cryptographic randomness
- Files: `auth-service/Services/AuthService.cs`
- Trigger: Codes used for email verification (line 75), 2FA (line 122), password reset (line 213)
- Workaround: None - codes are cryptographically weak
- Fix approach: Use `RandomNumberGenerator.Create()` like `JwtService.cs` does (line 53). Generate longer alphanumeric codes (e.g., 8+ characters). Consider TOTP for 2FA instead of time-based 6-digit codes.

**JWT Token Expiry Not Enforced in Middleware:**
- Symptoms: `JwtService.cs` generates tokens with 60-minute default expiry (lines 27, 61) but token validation happens at controller level with `[Authorize]`
- Files: `auth-service/Services/JwtService.cs`, `chat-service/ChatService/Controllers/ChatController.cs`
- Impact: If JWT validation middleware has a bug, expired tokens could still access resources
- Fix approach: Ensure `JwtBearer` authentication handler in `Program.cs` validates expiry (configure token validation parameters with `ValidateLifetime = true`).

## Security Considerations

**Sensitive Data Logged:**
- Risk: `AuthService.cs` logs emails in plain text (lines 29, 34, 45, 50, 61, 93, 98, 109, 125)
- Files: `auth-service/Services/AuthService.cs`, `auth-service/Controllers/AuthController.cs`
- Current mitigation: Log levels could be configured to suppress in production, but no masking in code
- Recommendations: Mask email in logs with pattern like `u***r@example.com`. Use structured logging with redaction filters. Never log passwords or verification codes (audit for line 125 which logs 2FA code).

**API Key in Headers Not Rate-Limited by Key:**
- Risk: `InternalApiKeyMiddleware.cs` validates X-Internal-API-Key header but platform doesn't rate-limit by API key, only by IP
- Files: `AI-Wrapper-Service/AIWrapperService/Middleware/InternalApiKeyMiddleware.cs`, `AI-Wrapper-Service/AIWrapperService/Middleware/RateLimitingMiddleware.cs`
- Current mitigation: Internal-only API (not exposed to clients)
- Recommendations: Implement per-API-key rate limiting. Rotate API key regularly. Store in secure configuration (Azure Key Vault, AWS Secrets Manager), never in code/configs.

**OpenAI API Key Exposed in Authorization Header:**
- Risk: `OpenAIChatService.cs` line 73 stores OpenAI API key in HttpClient default headers where it persists across all requests
- Files: `AI-Wrapper-Service/AIWrapperService/Services/OpenAIChatService.cs`
- Current mitigation: Key is from environment/config, not hardcoded
- Recommendations: Add per-request header injection instead of default headers to minimize key exposure surface. Consider using Azure OpenAI instead of direct OpenAI access for better audit trails.

**Unencrypted Verification Codes in Database:**
- Risk: Email verification and 2FA codes stored in plaintext in `verificationcodes` table
- Files: `auth-service/Services/AuthService.cs` (called via `_userRepository.CreateVerificationCodeAsync()`)
- Current mitigation: Codes expire after 5 minutes for 2FA (line 120), but email codes have unspecified TTL
- Recommendations: Hash verification codes before storing (use bcrypt/Argon2). Lookup by hash. Add explicit TTL column to `verificationcodes` table with database-level cleanup job.

**No Input Validation on String Length:**
- Risk: Session names and chat messages have no length validation before database insert
- Files: `chat-service/ChatService/Services/SessionService.cs` (line 144), `chat-service/ChatService/Services/chatService.cs` (line 29)
- Current mitigation: Database columns may have length constraints (e.g., `sessionName VARCHAR(100)` in schema)
- Recommendations: Add explicit validation in service layer with clear error messages. Validate before calling database layer. Use FluentValidation for request DTOs.

**Email Verification Code Brute-Force Risk:**
- Risk: No rate limiting on `/api/auth/verify-email` endpoint
- Files: `auth-service/Controllers/AuthController.cs` (line 71-85)
- Current mitigation: 6-digit codes have 1-million possible combinations, but codes don't lock account after N failed attempts
- Recommendations: Add rate limiting per email address. Implement account lockout after 5 failed verification attempts. Use longer codes (8+ characters alphanumeric).

## Performance Bottlenecks

**Chat History Deserialization on Every Request:**
- Problem: `OpenAIChatService.cs` deserializes JSON context on every chat request (lines 92-106), then serializes it again (chatService.cs line 49)
- Files: `AI-Wrapper-Service/AIWrapperService/Services/OpenAIChatService.cs`, `chat-service/ChatService/Services/chatService.cs`
- Cause: History is stored as JSON string, not structured data. Forces repeated serialization round-trips.
- Improvement path: Store chat history in structured format (array column, JSONB in PostgreSQL). Query last N messages directly from database instead of serializing entire history.

**N+1 Query Problem in Session Listing:**
- Problem: `GetSessionsByUserAsync()` returns sessions but frontend may load each session's chat count separately
- Files: `chat-service/ChatService/Services/SessionService.cs` (line 89)
- Cause: No batch loading of session metadata
- Improvement path: Add view or aggregate function that returns sessions with message count and last message timestamp. Implement query projection to reduce data transfer.

**No Connection Pooling Configuration Visible:**
- Problem: `NpgsqlDataSource.Create()` called with connection string but pool size not configured
- Files: `chat-service/ChatService/APIs/Providers/SessionDatabaseProvider.cs` (line 27), `chat-service/ChatService/APIs/Providers/ChatDatabaseProvider.cs` (line 27)
- Cause: Default connection pool size may be insufficient for concurrent chat requests
- Improvement path: Configure `NpgsqlDataSourceBuilder` with explicit `MaxPoolSize` (e.g., 20-50 based on concurrency). Monitor connection pool exhaustion.

## Fragile Areas

**Chat History Role Detection:**
- Files: `chat-service/ChatService/Services/chatService.cs` (lines 44-48), `frontend/src/services/chatApi.js` (lines 32-37)
- Why fragile: Dual responsibility (backend + frontend) for role assignment with index-based heuristic
- Safe modification: Store role explicitly in database Chat entity. Update both creation paths to explicitly set role. Add integration tests verifying correct role assignment.
- Test coverage: Missing - no test verifies chat history role assignment correctness

**Database Connection Lifecycle:**
- Files: `chat-service/ChatService/APIs/Providers/ChatDatabaseProvider.cs`, `chat-service/ChatService/APIs/Providers/SessionDatabaseProvider.cs`
- Why fragile: Mixed use of datasource pool vs direct connection instantiation
- Safe modification: Audit all database methods, replace direct `NpgsqlConnection()` with `_dataSource.OpenConnectionAsync()`. Add integration tests that measure connection pool usage.
- Test coverage: Missing - no connection pool exhaustion tests

**Exception Handling in Controllers:**
- Files: `auth-service/Controllers/AuthController.cs`, `chat-service/ChatService/Controllers/ChatController.cs`
- Why fragile: Broad `catch (Exception ex)` blocks return exception message directly to client
- Safe modification: Create typed exceptions for each error case. Implement global exception handler middleware that maps exceptions to standardized API responses. Hide internal error details from client.
- Test coverage: Partial - error handling tests exist but don't cover all exception types

**Password Reset Flow:**
- Files: `auth-service/Services/AuthService.cs` (lines 198-242)
- Why fragile: Intentionally hides whether email exists (line 209) to prevent user enumeration, but logs warning. If attacker can access logs, they can enumerate users.
- Safe modification: Remove user enumeration logging. Use constant-time response for both found/not-found cases. Store reset codes with short expiry (1 hour max).
- Test coverage: Partial - password reset tested but not user enumeration attack vectors

## Scaling Limits

**Session Cache Without Expiration Policy:**
- Current capacity: Unbounded cache in memory (via `ICacheServiceProvider`)
- Limit: Cache grows indefinitely for active long-running chats
- Scaling path: Implement TTL-based cache expiration (30-60 minutes). Add cache size limit with LRU eviction.

**No Pagination on Chat History Retrieval:**
- Current capacity: `getChatsBySessionAsync()` returns all messages for a session
- Limit: Sessions with 10,000+ messages will cause memory bloat and slow response
- Scaling path: Implement cursor-based pagination in `IChatDatabaseProvider.getChatsBySessionAsync()`. Return max 50 messages per page. Include `hasMore` flag in response.

**OpenAI API Version Pinning:**
- Risk: `OpenAIChatService.cs` hardcodes `"model": "gpt-4o-mini"` - if OpenAI deprecates this model, service breaks
- Impact: Chat completions fail with HTTP 400/404 errors
- Migration plan: Add model configurable from settings. Implement retry with alternative model if primary fails.

## Test Coverage Gaps

**Chat History Role Assignment:**
- What's not tested: `chatService.SendChatMessageAsync()` role detection and history serialization
- Priority: High - affects core functionality

**Session Authorization Boundary:**
- What's not tested: User A accessing User B's sessions via session ID manipulation
- Priority: Critical - security issue

**OpenAI API Error Scenarios:**
- What's not tested: Graceful handling of OpenAI rate limits (HTTP 429), token limit exceeded, model unavailable
- Priority: High - impacts user experience

**Password Reset Token Expiry:**
- What's not tested: Password reset codes expire correctly, cannot be reused after expiry
- Priority: High - security issue

---

*Concerns audit: 2026-03-25*
