# Architecture

**Analysis Date:** 2026-03-25

## Pattern Overview

**Overall:** Microservices architecture with API gateway pattern and mobile client.

**Key Characteristics:**
- Distributed backend services (Auth, Chat, AI Wrapper) with separate databases
- Frontend mobile app (React Native/Expo) communicating via REST APIs
- Auth service acts as reverse proxy gateway using YARP (Yet Another Reverse Proxy)
- Internal service-to-service communication with API key authentication
- Session and conversation state managed across distributed services

## Layers

**Presentation Layer (Mobile Frontend):**
- Location: `frontend/src/`
- Contains: React Native screens, navigation stacks, UI components
- Depends on: REST APIs (Chat Service, Auth Service)
- Used by: End users via iOS/Android/Web (Expo)

**API Gateway Layer (Auth Service):**
- Purpose: Single entry point for authentication and request routing
- Location: `auth-service/`
- Contains: Controllers, JWT validation, reverse proxy configuration
- Depends on: PostgreSQL (users), external Notification Service
- Used by: Frontend clients, internal service routing

**Chat Service Layer:**
- Purpose: Message persistence and session management
- Location: `chat-service/ChatService/`
- Contains: Controllers, service business logic, database providers
- Depends on: PostgreSQL (chat/sessions), Redis (cache), AI Wrapper Service
- Used by: Frontend via Auth gateway

**AI Wrapper Service Layer:**
- Purpose: LLM abstraction and normalization
- Location: `AI-Wrapper-Service/AIWrapperService/`
- Contains: OpenAI integration, request/response mapping, Swagger documentation
- Depends on: OpenAI API, internal API key authentication
- Used by: Chat Service via HTTP client

**Data Persistence Layer:**
- Databases: PostgreSQL (Auth, Chat services), Redis (session cache)
- Location: `**/Database/Scripts/`
- Contains: Schema definitions, stored procedures, migrations

## Data Flow

**Chat Conversation Flow:**

1. User sends message via `frontend/src/screens/AIChatScreen.js`
2. Frontend calls `chatApi.sendMessage()` via `frontend/src/services/chatApi.js`
3. Request hits Auth Service gateway (`auth-service/Program.cs`) with JWT
4. Auth Service validates token and routes to Chat Service (`chat-service/ChatService/Controllers/ChatController.cs`)
5. ChatController receives request at `POST /chatService/api/chatRequest`
6. `ChatService.SendChatMessageAsync()` orchestrates:
   - Gets or creates session via `SessionService.GetOrCreateSessionAsync()`
   - SessionService checks Redis cache (key: `session:{sessionId}`)
   - If miss, fetches from PostgreSQL via `ISessionDatabaseProvider`
   - Retrieves chat history from PostgreSQL via `IChatDatabaseProvider`
   - Serializes history as JSON context
   - Calls AI Wrapper via `IChatWrapperClientInterface`
7. Chat Wrapper HTTP client sends to `AI-Wrapper-Service` at `POST /chat/ChatResponse`
8. AI Wrapper validates request, calls OpenAI API with system prompt and history
9. OpenAI response returned and normalized
10. Chat Service persists AI response and user message to PostgreSQL
11. Response returned to frontend with sessionId
12. Frontend updates conversation UI

**State Management Flow:**

- User authentication state: Managed in `AuthContext.js` using SecureStore (token, userId, email)
- Theme state: Managed in `ThemeContext.js` (light/dark mode colors)
- Conversation state: Stored in PostgreSQL sessions table, cached in Redis during conversation
- Service discovery: Hard-coded base URLs in configuration

## Key Abstractions

**Dependency Injection Pattern:**
- Auth Service: Program.cs registers services (JWT, Repositories, Notification client)
- Chat Service: `DependencyInjectionContainer.cs` registers all dependencies
- AI Wrapper: Program.cs with typed HttpClient for OpenAI service

**Interface-Based Design:**
- `IChatService`: Abstracts chat business logic
- `ISessionService`: Abstracts session management with caching
- `ISessionDatabaseProvider`: Abstracts database access for sessions
- `IChatDatabaseProvider`: Abstracts database access for chat messages
- `IChatWrapperClientInterface`: Abstracts AI Wrapper HTTP communication
- `ICacheServiceProvider`: Abstracts Redis caching
- `IOpenAIChatService`: Abstracts OpenAI API integration

**Data Transfer Objects (DTOs):**
- `ChatRequest`: Frontend request with userId, message, context, sessionId
- `ChatResponse`: Response with userId, message, context, sessionId
- `ChatSession`: Session entity with id, userId, createdDate, isBookmarked
- `Chat`: Individual message entity with id, userId, message, sessionId, status

## Entry Points

**Frontend Entry Points:**
- `frontend/src/navigation/AppNavigator.js`: Root navigation wrapper
  - Triggers: App initialization via Expo
  - Responsibilities: Conditional rendering (AuthStack vs MainTabs based on auth state)
- `frontend/src/navigation/AuthStack.js`: Authentication flow (Login, Register, 2FA)
- `frontend/src/navigation/MainTabs.js`: Primary tab navigator (Home, Journal, Chat, Settings)
- `frontend/src/navigation/ChatStack.js`: Chat sub-navigation

**Backend Entry Points:**
- `auth-service/Program.cs`: Authentication gateway
  - Port: Configurable (typically 5000-5002)
  - Endpoints: `/auth/*` (login, register, verify), reverse proxy routes
  - Startup: Configures JWT validation, CORS, reverse proxy, services
- `chat-service/ChatService/Program.cs`: Chat service
  - Port: Configurable (typically 5003-5005)
  - Endpoints: `/chatService/api/chatRequest`, `/chatService/api/chat/{sessionId}`, `/chatService/api/sessions`
  - Startup: Registers services, configures authentication, Redis cache
- `AI-Wrapper-Service/AIWrapperService/Program.cs`: AI service
  - Port: Configurable (typically 5006-5008)
  - Endpoints: `/chat/ChatResponse` (POST with validation)
  - Startup: Swagger UI at root, health check at `/health`

## Error Handling

**Strategy:** Hierarchical error handling with context propagation.

**Frontend (JavaScript/React Native):**
- Try-catch in async functions with error message logging
- Service methods return `{ error, data }` envelope (see `frontend/src/services/chatApi.js`)
- Errors displayed to user with fallback messages
- HTTP errors caught at API client level

**Auth Service (.NET):**
- JWT validation with detailed error messages
- ExceptionHandlingMiddleware catches unhandled exceptions
- Returns formatted error responses with trace IDs
- Reverse proxy errors mapped to ProblemDetails (RFC 7807)

**Chat Service (.NET):**
- Controller methods catch specific exceptions:
  - `KeyNotFoundException` -> 404 NotFound
  - `ArgumentException` -> 400 BadRequest
  - Generic exceptions -> 500 InternalServerError
- ILogger used throughout for server-side logging
- Detailed error contexts passed to frontend via status codes

**AI Wrapper Service (.NET):**
- Request validation in `ChatApi.ValidateRequest()`
- HTTP errors from OpenAI caught and re-thrown as `HttpRequestException`
- Timeout handling via `TaskCanceledException`
- All exceptions mapped to ProblemDetails with traceId
- No sensitive data logged (only metadata: latency, requestId)

## Cross-Cutting Concerns

**Logging:**
- Frontend: `console.log/warn/error` (no structured logging)
- Backend: ILogger<T> dependency injection with LogLevel configuration
- AI Wrapper: Never logs message content or PII, only metadata (latency, ids)

**Validation:**
- Frontend: Basic null/empty checks before API calls
- Backend: Explicit validation in service methods, DTO-level validation planned
- Chat API: Request validation with enumerated error messages

**Authentication:**
- Frontend: JWT stored in Expo SecureStore, sent via Authorization header
- Auth Service: JWT validation with SymmetricSecurityKey, claims extraction
- Internal Services: X-Internal-Api-Key header (Chat -> AI Wrapper, Auth -> Notification)
- Rate Limiting: RateLimitingMiddleware in AI Wrapper Service

**Caching:**
- Redis instance for session caching in Chat Service
- Cache key pattern: `session:{sessionId}`
- Cache invalidation on session updates (name, bookmark, delete)
- Cache strategy: Get-or-fetch with validation against database

**CORS:**
- Auth Service: Configurable by environment (AllowAnyOrigin in dev, restricted origins in prod)
- Chat Service: DenyAll policy (internal-only via Auth gateway)
- AI Wrapper: No CORS configuration (internal-only)

**Request Tracing:**
- Activity.Current?.Id or Guid.NewGuid() used for requestId
- RequestId included in error responses and logs
- Enables request tracking across service boundaries

---

*Architecture analysis: 2026-03-25*
