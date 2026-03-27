<!-- GSD:project-start source:PROJECT.md -->
## Project

**AI Wellness Platform — Hardening Milestone**

A codebase hardening effort for the AI Wellness Platform — a mobile mental wellness app with AI chat, journaling, and authentication. This milestone addresses all concerns identified in the codebase audit: security vulnerabilities, known bugs, tech debt, performance bottlenecks, fragile areas, and test coverage gaps.

**Core Value:** Security first — fix vulnerabilities and protect user data before anything else. Every fix must include tests proving the concern is resolved.

### Constraints

- **Tech stack**: Must stay within existing .NET / React Native / PostgreSQL stack
- **Backwards compatibility**: Database schema changes must be migration-safe (no data loss)
- **Security priority**: Security fixes take precedence over all other categories when conflicts arise
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- C# .NET 8.0 / 9.0 - Backend services (API layer, business logic)
- JavaScript (React Native) - Mobile frontend via Expo
- TypeScript - Frontend type safety (Expo/React Native)
- SQL (PostgreSQL dialect) - Database scripts and stored procedures
## Frameworks
- ASP.NET Core 8.0/9.0 - HTTP API framework (`auth-service/`, `chat-service/`, `AI-Wrapper-Service/`, `notification-service/`, `journal-service/`)
- React Native 0.81.5 + Expo 54.0.33
- React Navigation 7.x (@react-navigation/native-stack, @react-navigation/bottom-tabs)
## Key Dependencies
- Npgsql 9.0.0-10.0.1 - PostgreSQL data provider
- BCrypt.Net-Next 4.0.3 - Password hashing (`auth-service/`)
- Dapper 2.1.35 - ORM (`auth-service/`)
- System.IdentityModel.Tokens.Jwt 8.3.0 - JWT tokens
- Microsoft.AspNetCore.Authentication.JwtBearer 8.0.0/9.0.0
- Microsoft.Extensions.Caching.StackExchangeRedis 10.0.3 - Redis caching (`chat-service/`)
- Yarp.ReverseProxy 2.2.0 - API gateway (`auth-service/`)
- FirebaseAdmin 3.4.0 - Push notifications (`notification-service/`)
- date-fns 4.1.0, expo-notifications 0.32.16, expo-secure-store 15.0.8
- @react-native-async-storage/async-storage 2.2.0
- xUnit 2.9.3, Moq 4.20.72, FluentAssertions 8.8.0, coverlet
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- PascalCase for class files: `OpenAIChatService.cs`, `ChatRequest.cs`, `InternalApiKeyMiddleware.cs`
- DTOs placed in `DTOs/` directory: `ChatRequest.cs`, `ChatResponse.cs`, `ChatHistoryItem.cs`
- Interfaces prefixed with `I`: `IOpenAIChatService.cs`, `IChatService.cs`
- Services suffixed with `Service`: `OpenAIChatService.cs`, `chatService.cs`
- camelCase for utilities and services: `chatApi.js`
- PascalCase for components (screens): `AIChatScreen.js`
- camelCase for context: `AuthContext.js`, `ThemeContext.js`
- PascalCase: `OpenAIChatService`, `ChatRequest`, `CustomWebApplicationFactory`
- Sealed classes when inheritance not needed: `sealed class OpenAIChatService`
- Record types for immutable DTOs: `public sealed record ChatRequest(...)`
- PascalCase for public methods: `GetChatResponseAsync()`, `SendChatMessageAsync()`
- Async methods suffixed with `Async`: `GetChatResponseAsync()`, `InvokeAsync()`
- Private static methods are lowercase (static helper): `ValidateRequest()`, `CreateMockHttpHandler()`
- camelCase for all functions: `sendMessage()`, `loadHistory()`, `normalizeMessage()`
- useCallback hooks for memoized callbacks: `useCallback(async () => {...}, [])`
- Getter functions prefixed with `create` or `get`: `CreateAuthenticatedRequest()`, `formatMessageTime()`
- PascalCase for public properties: `ChatUserId`, `MessageRequest`
- camelCase for private fields prefixed with underscore: `_http`, `_logger`, `_sessionService`
- Readonly fields for dependency injection: `private readonly HttpClient _http`
- Constants in UPPER_SNAKE_CASE: `DefaultModel`, `TimeoutSeconds`, `SystemPrompt`, `ApiKeyHeader`
- camelCase for all variables: `inputText`, `messageText`, `isLoading`, `error`
- Boolean variables prefixed with `is`, `has`, `should`: `isLoadingHistory`, `isSending`, `isPending`
- State variables via `useState`: `const [messages, setMessages] = useState([])`
- PascalCase: `ChatRequest`, `ChatResponse`, `IOpenAIChatService`
- Records for immutable value objects: `public sealed record ChatRequest(...)`
- Null-conditional operators: `request?.params`
## Code Style
- Allman-style braces (opening brace on new line)
- 4-space indentation
- Line length: no strict limit observed, but generally <120 chars
- Blank lines separate logical sections within methods
- 2-space indentation (React Native convention)
- Implicit formatting (no enforced linter config found)
- Line length: typically <100 characters
- Nullable reference types enabled: `<Nullable>enable</Nullable>` in .csproj
- Implicit usings enabled: `<ImplicitUsings>enable</ImplicitUsings>`
- Global using statements in `GlobalUsings.cs` for common imports
- No `.eslintrc` or `.prettierrc` at project root (not enforced)
- Expo + React Native conventions followed implicitly
- No formatter configuration detected in frontend package.json
## Import Organization
- No aliases detected in frontend (direct relative imports used)
- Absolute imports in C# via namespaces
## Error Handling
- Catches specific exception types first, general exceptions last
- Logs full exception context with structured logging
- Returns RFC-7807 ProblemDetails format for HTTP errors
- Never swallows errors silently
- Async/await with try-catch not used
- Errors handled via result object: `{ error, data }`
- Errors set in component state: `setError(result.error || "message")`
- No explicit throwing, errors wrapped in response objects
- Input validation at system boundaries (controllers, service methods)
- Guards at start of functions: `if (string.IsNullOrWhiteSpace(...)) throw new ArgumentException(...)`
- Frontend validates before API calls: `if (!messageText || isSending) return;`
## Logging
- Structured logging with named parameters: `_logger.LogError(ex, "Failed for request {RequestId}", requestId)`
- Never log sensitive data (PII): "never log message content/PII"
- Use log levels appropriately:
## Comments
- Method-level summaries using XML doc comments (required)
- Inline comments for non-obvious logic
- Section markers: `// ===== Service Registration =====`
- Self-documenting code preferred over comments
- Names should be clear enough to avoid explanation
- Minimal comments (code is generally clear)
- Section comments for complex logic blocks
- No formal JSDoc pattern observed
## Function Design
- Methods typically 20-50 lines
- Longer methods (80+ lines) for integration tests acceptable (data setup)
- Example: `OpenAIChatService.GetChatResponseAsync()` is 99 lines (includes all error handling)
- Dependency injection via constructor for services
- Request objects as single parameter for API handlers: `CompleteChatAsync(ChatRequest request, ...)`
- Cancellation tokens as optional last parameter: `CancellationToken ct = default`
- Async methods return `Task<T>` or `Task`
- DTOs returned as-is (records): `Task<ChatResponse>`
- IReadOnlyList for collections: `Task<IReadOnlyList<Chat>>`
- Errors thrown as exceptions (not returned)
- Objects destructured for named parameters: `({ messageRequest, context = "", sessionId = null })`
- Default parameters in function signature: `fallbackRole = "assistant"`
- Objects for complex payloads
- Functions return response objects: `{ error, data }`
- Callbacks return void (side effects via setState)
- Normalization functions return null on invalid input
## Module Design
- Classes are top-level: `public sealed class OpenAIChatService`
- Interfaces in separate files: `IOpenAIChatService.cs`
- Records for DTOs: `public sealed record ChatRequest(...)`
- Static utility methods: `static class ChatApi` for mapping endpoints
- Global using statements in `GlobalUsings.cs` for common types
- Named exports for services: `export const chatApi = { ... }`
- Default exports for components: `export function AIChatScreen({ ... })`
- No barrel files (index.js) observed
- API client abstraction: `apiClient.get()`, `apiClient.post()`, `apiClient.patch()`
- Normalization functions wrap API responses: `normalizeMessage()`, `normalizeSession()`
- Services never expose raw HTTP responses
## Constants
## Immutability Patterns
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Distributed backend services (Auth, Chat, AI Wrapper) with separate databases
- Frontend mobile app (React Native/Expo) communicating via REST APIs
- Auth service acts as reverse proxy gateway using YARP (Yet Another Reverse Proxy)
- Internal service-to-service communication with API key authentication
- Session and conversation state managed across distributed services
## Layers
- Location: `frontend/src/`
- Contains: React Native screens, navigation stacks, UI components
- Depends on: REST APIs (Chat Service, Auth Service)
- Used by: End users via iOS/Android/Web (Expo)
- Purpose: Single entry point for authentication and request routing
- Location: `auth-service/`
- Contains: Controllers, JWT validation, reverse proxy configuration
- Depends on: PostgreSQL (users), external Notification Service
- Used by: Frontend clients, internal service routing
- Purpose: Message persistence and session management
- Location: `chat-service/ChatService/`
- Contains: Controllers, service business logic, database providers
- Depends on: PostgreSQL (chat/sessions), Redis (cache), AI Wrapper Service
- Used by: Frontend via Auth gateway
- Purpose: LLM abstraction and normalization
- Location: `AI-Wrapper-Service/AIWrapperService/`
- Contains: OpenAI integration, request/response mapping, Swagger documentation
- Depends on: OpenAI API, internal API key authentication
- Used by: Chat Service via HTTP client
- Databases: PostgreSQL (Auth, Chat services), Redis (session cache)
- Location: `**/Database/Scripts/`
- Contains: Schema definitions, stored procedures, migrations
## Data Flow
- User authentication state: Managed in `AuthContext.js` using SecureStore (token, userId, email)
- Theme state: Managed in `ThemeContext.js` (light/dark mode colors)
- Conversation state: Stored in PostgreSQL sessions table, cached in Redis during conversation
- Service discovery: Hard-coded base URLs in configuration
## Key Abstractions
- Auth Service: Program.cs registers services (JWT, Repositories, Notification client)
- Chat Service: `DependencyInjectionContainer.cs` registers all dependencies
- AI Wrapper: Program.cs with typed HttpClient for OpenAI service
- `IChatService`: Abstracts chat business logic
- `ISessionService`: Abstracts session management with caching
- `ISessionDatabaseProvider`: Abstracts database access for sessions
- `IChatDatabaseProvider`: Abstracts database access for chat messages
- `IChatWrapperClientInterface`: Abstracts AI Wrapper HTTP communication
- `ICacheServiceProvider`: Abstracts Redis caching
- `IOpenAIChatService`: Abstracts OpenAI API integration
- `ChatRequest`: Frontend request with userId, message, context, sessionId
- `ChatResponse`: Response with userId, message, context, sessionId
- `ChatSession`: Session entity with id, userId, createdDate, isBookmarked
- `Chat`: Individual message entity with id, userId, message, sessionId, status
## Entry Points
- `frontend/src/navigation/AppNavigator.js`: Root navigation wrapper
- `frontend/src/navigation/AuthStack.js`: Authentication flow (Login, Register, 2FA)
- `frontend/src/navigation/MainTabs.js`: Primary tab navigator (Home, Journal, Chat, Settings)
- `frontend/src/navigation/ChatStack.js`: Chat sub-navigation
- `auth-service/Program.cs`: Authentication gateway
- `chat-service/ChatService/Program.cs`: Chat service
- `AI-Wrapper-Service/AIWrapperService/Program.cs`: AI service
## Error Handling
- Try-catch in async functions with error message logging
- Service methods return `{ error, data }` envelope (see `frontend/src/services/chatApi.js`)
- Errors displayed to user with fallback messages
- HTTP errors caught at API client level
- JWT validation with detailed error messages
- ExceptionHandlingMiddleware catches unhandled exceptions
- Returns formatted error responses with trace IDs
- Reverse proxy errors mapped to ProblemDetails (RFC 7807)
- Controller methods catch specific exceptions:
- ILogger used throughout for server-side logging
- Detailed error contexts passed to frontend via status codes
- Request validation in `ChatApi.ValidateRequest()`
- HTTP errors from OpenAI caught and re-thrown as `HttpRequestException`
- Timeout handling via `TaskCanceledException`
- All exceptions mapped to ProblemDetails with traceId
- No sensitive data logged (only metadata: latency, requestId)
## Cross-Cutting Concerns
- Frontend: `console.log/warn/error` (no structured logging)
- Backend: ILogger<T> dependency injection with LogLevel configuration
- AI Wrapper: Never logs message content or PII, only metadata (latency, ids)
- Frontend: Basic null/empty checks before API calls
- Backend: Explicit validation in service methods, DTO-level validation planned
- Chat API: Request validation with enumerated error messages
- Frontend: JWT stored in Expo SecureStore, sent via Authorization header
- Auth Service: JWT validation with SymmetricSecurityKey, claims extraction
- Internal Services: X-Internal-Api-Key header (Chat -> AI Wrapper, Auth -> Notification)
- Rate Limiting: RateLimitingMiddleware in AI Wrapper Service
- Redis instance for session caching in Chat Service
- Cache key pattern: `session:{sessionId}`
- Cache invalidation on session updates (name, bookmark, delete)
- Cache strategy: Get-or-fetch with validation against database
- Auth Service: Configurable by environment (AllowAnyOrigin in dev, restricted origins in prod)
- Chat Service: DenyAll policy (internal-only via Auth gateway)
- AI Wrapper: No CORS configuration (internal-only)
- Activity.Current?.Id or Guid.NewGuid() used for requestId
- RequestId included in error responses and logs
- Enables request tracking across service boundaries
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
