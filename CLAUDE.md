<!-- GSD:project-start source:PROJECT.md -->
## Project

**AI Wellness Platform -- Hardening Milestone**

A codebase hardening effort for Sakina, a mobile mental wellness app built with React Native/Expo and .NET microservices. The app provides AI-powered chat therapy, journaling with pattern analysis, community support, breathing exercises, and mood tracking. This milestone fixes every concern identified in the codebase audit -- security vulnerabilities, known bugs, tech debt, performance bottlenecks, fragile areas, and test coverage gaps -- so the platform is production-ready for real users and capstone evaluation.

**Core Value:** Security first -- fix vulnerabilities and protect user data before anything else. Every fix must include tests proving the concern is resolved.

### Constraints

- **Tech stack**: Must stay within existing .NET / React Native / PostgreSQL stack
- **Backwards compatibility**: Database schema changes must be migration-safe (no data loss)
- **Security priority**: Security fixes take precedence over all other categories when conflicts arise
- **No new features**: Hardening only -- no new functionality during this milestone
- **Test with every fix**: Every fix must include a test proving the concern is resolved
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- C# (.NET 8.0 / 9.0) - All backend services (API layer, business logic, data access)
- JavaScript (ES2020+) - Frontend mobile app via React Native / Expo
- SQL (PostgreSQL dialect) - Database schemas, stored procedures, seed scripts
- TypeScript - Type annotations in frontend (Expo supports TS, but codebase is predominantly `.js`)
## Runtime
- .NET 9.0 - auth-service, AI-Wrapper-Service, notification-service, journal-service, community-service
- .NET 8.0 - chat-service (behind other services on framework version)
- ASP.NET Core runtime images: `mcr.microsoft.com/dotnet/aspnet:9.0`
- Node.js (version not pinned; no `.nvmrc` or `.node-version` file)
- Expo SDK 54.0.33 - React Native build/dev toolchain
- React Native 0.81.5 with New Architecture enabled (`newArchEnabled: true`)
- npm (frontend) - `package-lock.json` present at both root and `frontend/`
- NuGet (backend) - package references in each `.csproj`
- No lockfile (`packages.lock.json`) detected for any .NET project
## Frameworks
- ASP.NET Core 9.0 - HTTP API framework for 5 of 6 backend services
- ASP.NET Core 8.0 - chat-service only
- React Native 0.81.5 + Expo 54.0.33 - Mobile frontend (iOS, Android, Web)
- React 19.1.0 - UI library
- React Navigation 7.x - Navigation (`@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `@react-navigation/drawer`)
- YARP (Yet Another Reverse Proxy) 2.2.0 - Routes requests from auth-service gateway to downstream services
- xUnit 2.9.2-2.9.3 - Test runner (backend)
- FluentAssertions 8.8.0 - Assertion library (AI Wrapper tests)
- Moq 4.20.72 - Mocking framework (AI Wrapper tests)
- coverlet 6.0.0-6.0.2 - Code coverage collection
- Microsoft.AspNetCore.Mvc.Testing 9.0.0 - Integration test host (AI Wrapper tests)
- Microsoft.NET.Test.Sdk 17.12.0-18.0.1 - Test platform
- No frontend test framework detected (no Jest, Vitest, or testing-library in `package.json`)
- Docker + Docker Compose - Multi-service containerized deployment
- Expo CLI - Frontend build and development server
- Swagger / Swashbuckle.AspNetCore 10.0.0 - API documentation (auth-service, AI-Wrapper-Service)
- DotNetEnv 3.1.1 - `.env` file loading (AI-Wrapper-Service only)
## Key Dependencies (per service)
### auth-service (`auth-service/AuthService.csproj`) - .NET 9.0
- `BCrypt.Net-Next` 4.0.3 - Password hashing
- `Dapper` 2.1.35 - Micro-ORM for PostgreSQL queries
- `Npgsql` 9.0.0 - PostgreSQL data provider
- `System.IdentityModel.Tokens.Jwt` 8.3.0 - JWT token creation/validation
- `Microsoft.AspNetCore.Authentication.JwtBearer` 9.0.0 - JWT bearer auth middleware
- `Microsoft.Extensions.Caching.Memory` 9.0.0 - In-memory cache
- `Yarp.ReverseProxy` 2.2.0 - Reverse proxy gateway
- `Swashbuckle.AspNetCore` 10.0.0 - Swagger
### chat-service (`chat-service/ChatService/ChatService.csproj`) - .NET 8.0
- `Npgsql` 9.0.4 - PostgreSQL data provider
- `Microsoft.AspNetCore.Authentication.JwtBearer` 8.0.0 - JWT bearer auth
- `Microsoft.Extensions.Caching.StackExchangeRedis` 10.0.3 - Redis distributed cache
- `Microsoft.IdentityModel.Protocols.OpenIdConnect` 8.15.0 - OIDC protocol support
- `xunit` 2.9.3, `Microsoft.NET.Test.Sdk` 18.0.1 - Tests in main project (non-standard)
### AI-Wrapper-Service (`AI-Wrapper-Service/AIWrapperService/AiWrapperService.csproj`) - .NET 9.0
- `DotNetEnv` 3.1.1 - Environment file loading
- `Swashbuckle.AspNetCore` 10.0.0 - Swagger
- `Microsoft.AspNetCore.OpenApi` 9.0.0 - OpenAPI support
- Uses `HttpClient` directly (no OpenAI SDK)
### notification-service (`notification-service/src/NotificationService.Api/NotificationService.Api.csproj`) - .NET 9.0
- `FirebaseAdmin` 3.4.0 - Firebase push notifications (optional, kept for future use)
- `Npgsql` 10.0.1 - PostgreSQL data provider
- `Microsoft.AspNetCore.OpenApi` 9.0.11 - OpenAPI support
- Uses `System.Net.Mail.SmtpClient` for email delivery (no SendGrid SDK)
- Uses raw `HttpClient` for Twilio SMS API (no Twilio SDK)
- Uses raw `HttpClient` for Expo Push API
### journal-service (`journal-service/src/JournalService.Api/JournalService.Api.csproj`) - .NET 9.0
- `Npgsql` 10.0.1 - PostgreSQL data provider
- `Microsoft.AspNetCore.OpenApi` 9.0.0 - OpenAPI support
### community-service (`community-service/CommunityService/CommunityService.csproj`) - .NET 9.0
- `Npgsql` 9.0.3 - PostgreSQL data provider
### frontend (`frontend/package.json`)
- `expo` ~54.0.33 - Build platform
- `react` 19.1.0, `react-native` 0.81.5 - UI framework
- `expo-secure-store` ~15.0.8 - Secure token storage
- `expo-notifications` ~0.32.16 - Push notification handling
- `expo-image-picker` ~17.0.10 - Photo attachments
- `expo-speech-recognition` ^3.1.2 - Voice input
- `expo-haptics` ~15.0.8 - Haptic feedback
- `expo-localization` ~17.0.8 - i18n support
- `date-fns` ^4.1.0, `date-fns-tz` ^3.2.0 - Date formatting
- `react-native-reanimated` ~4.1.1 - Animations
- `react-native-gesture-handler` ~2.28.0 - Gestures
- `react-native-markdown-display` ^7.0.2 - Markdown rendering
- `@react-native-async-storage/async-storage` 2.2.0 - Local key-value storage
- `@expo-google-fonts/dm-sans` ^0.4.2 - Custom font
## Build & Tooling
- Multi-stage Dockerfiles for all backend services (SDK build -> ASP.NET runtime)
- Base images: `mcr.microsoft.com/dotnet/sdk:9.0` (build), `mcr.microsoft.com/dotnet/aspnet:9.0` (runtime)
- `docker-compose.yml` at project root orchestrates all services + databases + Redis
- PostgreSQL 16 for all database containers
- Redis 7 Alpine for session caching
- No `.eslintrc`, `.prettierrc`, or `biome.json` - No frontend linting/formatting enforced
- No `tsconfig.json` in frontend - TypeScript not formally configured
- No CI/CD pipeline files (`.github/workflows/`, `Jenkinsfile`, etc.)
- No Makefile or build scripts at project root
- No `global.json` pinning .NET SDK version
- `frontend/app.config.js` - Expo app configuration
- App name: "Sakina"
- Bundle ID: `com.sakina.app`
- EAS project ID: `79057051-8f94-4dd2-b705-d8c5d2d5c060`
## Version Notes / Concerns
- chat-service targets `net8.0` while all other services target `net9.0`
- chat-service tests also target `net8.0`
- This creates a split dependency graph and prevents unified SDK pinning
- auth-service: `9.0.0`
- chat-service: `9.0.4`
- community-service: `9.0.3`
- journal-service: `10.0.1`
- notification-service: `10.0.1`
- Five different versions across five services
- `chat-service/ChatService/ChatService.csproj` includes `Microsoft.NET.Test.Sdk`, `xunit`, and `xunit.abstractions` in the main application project (not just the test project)
- No `devDependencies` section in `frontend/package.json`
- No test framework, linter, formatter, or TypeScript compiler configured
- No `packages.lock.json` in any .NET project - builds are not reproducible across environments
- chat-service targets `net8.0` but uses `Microsoft.Extensions.Caching.StackExchangeRedis` 10.0.3 (a .NET 10 preview package)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Conventions
### C# Backend
- PascalCase for class names and file names: `OpenAIChatService.cs`, `ChatController.cs`, `ExceptionHandlingMiddleware.cs`
- Interfaces prefixed with `I`: `IOpenAIChatService.cs`, `IChatService.cs`, `IChatDatabaseProvider.cs`
- Services suffixed with `Service`: `OpenAIChatService`, `SessionService`, `AuthService`
- Middleware suffixed with `Middleware`: `InternalApiKeyMiddleware`, `RateLimitingMiddleware`
- `sealed` keyword on service classes in AI-Wrapper-Service: `public sealed class OpenAIChatService`
- **Deviation in chat-service:** Class name `chatService` uses camelCase instead of PascalCase (`chat-service/ChatService/Services/chatService.cs`)
- AI-Wrapper-Service uses `sealed record` for DTOs: `public sealed record ChatRequest(...)` (`AI-Wrapper-Service/AIWrapperService/DTOs/ChatRequest.cs`)
- Chat-service also uses `sealed record` for DTOs: `public sealed record ChatRequest(...)` (`chat-service/ChatService/DTOs/ChatRequest.cs`)
- Auth-service uses mutable `class` for DTOs: `public class RegisterRequest { ... }` (`auth-service/DTOs/Requests/RegisterRequest.cs`)
- Auth-service responses also use mutable `class`: `public class LoginResponse { ... }` (`auth-service/DTOs/Responses/LoginResponse.cs`)
- Private fields prefixed with underscore: `_http`, `_logger`, `_sessionService`
- Private fields declared `readonly` for DI dependencies: `private readonly HttpClient _http`
- Constants use PascalCase (not UPPER_SNAKE_CASE): `DefaultModel`, `TimeoutSeconds`, `ApiKeyHeader`, `EndpointPath`
- **Deviation in chat-service entities:** Properties use inconsistent casing. `ChatSession` at `chat-service/ChatService/entities/chatSession.cs` mixes `sessionID` (camelCase+uppercase ID), `UserId` (PascalCase), `isBookmarked` (camelCase), `SessionName` (PascalCase)
- **Deviation in chat-service entities:** `Chat` entity at `chat-service/ChatService/entities/Chat.cs` uses camelCase properties: `chatUserId`, `chatReferenceId`, `message`, `isBookmarked` -- but `CreatedDate` is PascalCase
- PascalCase for public methods: `GetChatResponseAsync()`, `SendChatMessageAsync()`
- Async suffix required: `GetChatResponseAsync()`, `InvokeAsync()`, `RegisterAsync()`
- **Deviation in chat-service:** Database provider methods use camelCase: `getChatsBySessionAsync()`, `createChatAsync()`, `deleteChatAsync()` (`chat-service/ChatService/APIs/Providers/ChatDatabaseProvider.cs`)
- **Deviation in chat-service:** Configuration service methods use camelCase: `getBaseUrl()`, `getApiKey()`, `getConnectionString()` (`chat-service/ChatService/Services/ConfigurationService.cs`)
- AI-Wrapper-Service: `AIWrapperService.Services`, `AIWrapperService.DTOs`, `AIWrapperService.APIs`
- Auth-service: `AIWellness.Auth.Controllers`, `AIWellness.Auth.DTOs.Requests`, `AIWellness.Auth.Services`
- Chat-service: `ChatService.Services`, `ChatService.DTOs`, `ChatService.Interfaces`
- **Deviation:** Folder name casing is inconsistent: `entities` (lowercase) and `enums` (lowercase) in chat-service vs `DTOs`, `APIs`, `Services` (PascalCase)
### JavaScript/TypeScript Frontend
- PascalCase for screen components: `LoginScreen.js`, `AIChatScreen.js`, `HomeScreen.js`
- PascalCase for reusable components: `Button.js`, `Card.js`, `Banner.js`, `CrisisResourceModal.js`
- camelCase for services/utilities: `chatApi.js`, `authApi.js`, `api.js`, `time.js`
- camelCase for hooks: `usePatternInsights.js`, `useVoiceInput.js`, `useHaptic.js`
- camelCase for context files: `AuthContext.js`, `ThemeContext.js`, `OnboardingContext.js`
- camelCase for constants: `breathingPatterns.js`, `assessments.js`, `journal.js`
- camelCase for all functions: `sendMessage()`, `normalizeMessage()`, `handleLogin()`
- Default exports for screens: `export function LoginScreen({ navigation, route })`
- Named exports for services: `export const chatApi = { ... }`
- Named exports for hooks: `export function useAuth()`
- Normalization helpers prefixed with `normalize`: `normalizeMessage()`, `normalizeSession()`, `normalizeMessageList()`
- camelCase: `inputText`, `messageText`, `isLoading`
- Boolean state prefixed with `is`/`has`: `isLoading`, `isBookmarked`
- `useState` pattern: `const [messages, setMessages] = useState([])`
## Code Style
### C# Backend
- Allman-style braces (opening brace on new line) -- used consistently in AI-Wrapper-Service and notification-service
- **Deviation in auth-service:** Uses K&R-style braces in some places (opening brace on same line as if/else), and 2-space indentation instead of 4-space (`auth-service/Controllers/AuthController.cs`, `auth-service/Services/AuthService.cs`)
- **Deviation in chat-service:** Mixed indentation -- some files use 2-space, some use 4-space
- Enabled in all projects: `<Nullable>enable</Nullable>` in .csproj files
- Enabled in all projects: `<ImplicitUsings>enable</ImplicitUsings>`
- Used in AI-Wrapper-Service: `AI-Wrapper-Service/AIWrapperService/GlobalUsings.cs`
- Groups: ASP.NET Core, System, Project namespaces
### JavaScript Frontend
- 2-space indentation (React Native convention)
- No `.eslintrc`, `.prettierrc`, or formatter config at project root -- formatting is not enforced
- Double quotes for JSX strings, double quotes for imports
- No TypeScript strict mode -- frontend is pure JavaScript with no `.ts`/`.tsx` files
## Error Handling Patterns
### AI-Wrapper-Service (Best Practice -- Follow This)
### Auth-Service (Legacy Pattern -- Needs Alignment)
### Chat-Service (Mixed Pattern)
### Notification-Service and Auth-Service Middleware
### Frontend JavaScript
## Logging Patterns
### AI-Wrapper-Service (Best Practice -- Follow This)
### Auth-Service (Anti-Pattern -- Avoid)
### Chat-Service
### Frontend
## Dependency Injection
### AI-Wrapper-Service
### Chat-Service
- Singleton for config/options: `ChatServiceOptions`, `IConfigurationService`
- Scoped for services: `IChatService`, `ISessionService`
- Scoped for database providers: `IChatDatabaseProvider`, `ISessionDatabaseProvider`
- HttpClient via `AddHttpClient<>()` for typed clients
### Auth-Service
## DTO Patterns
### Record DTOs (AI-Wrapper-Service, Chat-Service)
### Class DTOs (Auth-Service)
### Request/Response Organization
- AI-Wrapper-Service: Flat `DTOs/` folder: `ChatRequest.cs`, `ChatResponse.cs`, `ChatHistoryItem.cs`
- Auth-service: Separated into `DTOs/Requests/` and `DTOs/Responses/`
- Chat-service: Flat `DTOs/` folder: `ChatRequest.cs`, `ChatResponse.cs`, `BookmarkRequest.cs`
- Notification-service: `Models/Requests/` and `Models/Responses/`
- Journal-service: `Models/Requests/` and `Models/Responses/`
## API Response Format
### Backend
- AI-Wrapper-Service: Returns DTO directly on success, ProblemDetails on error
- Auth-service: Returns DTO on success, `{ message: "..." }` on error
- Chat-service: Returns DTO on success, plain strings on error
- Notification-service: Uses `ErrorResponse` model on error
### Frontend
## Import Organization
### C# Backend
- Global usings in `GlobalUsings.cs` (AI-Wrapper-Service only)
- File-scoped namespaces: `namespace AIWrapperService.Services;`
- Order: System -> Microsoft -> Project namespaces
- **Deviation in chat-service:** Some files use block-scoped namespaces, some file-scoped
### JavaScript Frontend
- Order: React/React Native -> Expo -> Third-party -> Local imports
- Relative paths used throughout (no aliases or path mapping)
- Named imports for services: `import { apiClient } from "./api"`
- Named imports for hooks/context: `import { useAuth } from "../context/AuthContext"`
## Deviations / Inconsistencies
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Overview
- Auth service doubles as the API gateway (YARP reverse proxy)
- Internal services trust the gateway and extract user identity from forwarded headers (`X-User-Id`, `X-User-Email`)
- Each service has its own PostgreSQL database instance
- Redis is used exclusively by chat-service for session caching
- Frontend is a single React Native/Expo mobile app targeting iOS, Android, and web
## Service Map
```
```
## Communication Patterns
### Frontend to Gateway
- **Protocol:** HTTPS REST
- **Auth:** JWT Bearer token in `Authorization` header
- **Base URL:** Configured in `frontend/src/config/index.js` via `EXPO_PUBLIC_API_URL` (default `http://localhost:5051`)
- **Client:** Singleton `ApiClient` class in `frontend/src/services/api.js`
- **Response envelope:** `{ status, data, error }` for all API calls
- **Timeout:** 15 seconds (`API_TIMEOUT` in `frontend/src/config/index.js`)
- **Dev mode:** When `EXPO_PUBLIC_DEV_MODE=true`, userId is appended as query parameter to bypass gateway
### Gateway to Internal Services (YARP)
- **Mechanism:** YARP reverse proxy configured in `auth-service/appsettings.json` under `ReverseProxy`
- **Auth policy:** All proxy routes use `AuthorizationPolicy: "default"` (requires authenticated JWT)
- **Header injection:** Gateway extracts `ClaimTypes.NameIdentifier` and `ClaimTypes.Email` from the JWT and adds `X-User-Id` and `X-User-Email` headers to proxied requests (see `auth-service/Program.cs` lines 77-93)
| Frontend Path | Backend Service | Backend Path | Cluster |
|---|---|---|---|
| `/chat/{**catch-all}` | chat-service | `{**catch-all}` | `chat-cluster` |
| `/api/notifications/{**catch-all}` | notification-service | `api/notifications/{**catch-all}` | `notification-cluster` |
| `/api/journal/{**catch-all}` | journal-service | `api/journal/{**catch-all}` | `journal-cluster` |
| `/api/community/{**catch-all}` | community-service | `api/community/{**catch-all}` | `community-cluster` |
### Service-to-Service
- **chat-service -> AI-Wrapper-Service:** HTTP client with `X-Internal-Api-Key` header, configured in `chat-service/ChatService/DependencyInjectionContainer.cs`
- **auth-service -> notification-service:** HTTP client with `X-Internal-Api-Key` header for sending verification codes, configured in `auth-service/Program.cs` lines 95-104
### Internal Service User Identity
- **Production:** `UserContextMiddleware` extracts `X-User-Id` and `X-User-Email` from headers (e.g., `notification-service/src/NotificationService.Api/Middleware/UserContextMiddleware.cs`)
- **Development:** `DevelopmentUserContextMiddleware` allows testing without the gateway by accepting userId via query parameter or a dev header
- **User context:** Stored in `HttpContext.Items["AuthenticatedUser"]` and resolved via `IUserContext` / `HttpUserContext`
## Data Flow
### Chat Message Flow
### Authentication Flow
### State Management
- **Auth state:** `AuthContext` (`frontend/src/context/AuthContext.js`) - token, user object, login/logout methods
- **Theme state:** `ThemeContext` (`frontend/src/context/ThemeContext.js`) - colors, dark mode, accent color
- **Onboarding state:** `OnboardingContext` (`frontend/src/context/OnboardingContext.js`) - tracks first-run flow
- **Wellness tips:** `TipContext` (`frontend/src/context/TipContext.js`) - push notification tips display
- **Token storage:** `expo-secure-store` (encrypted device storage)
- **Session names:** `AsyncStorage` under key `chat_session_names_v1` (local-only, not synced)
- **Server-side sessions:** PostgreSQL (chat-service) with Redis cache layer
## Database Architecture
| Service | Database Name | Port (Docker) | Schema Location |
|---|---|---|---|
| auth-service | `authdb` | 5334 | `auth-service/Database/AuthSchema.sql`, `auth-service/Database/StoredProcedures.sql` |
| chat-service | `chatservicedb` | 5335 | `chat-service/Database/Scripts/Tables/`, `chat-service/Database/Scripts/StoreProcedures/` |
| notification-service | `wellness_notifications` | 5333 | `notification-service/database/01_schema.sql` through `04_indexes.sql` |
| journal-service | `wellness_journal` | 5336 | `journal-service/database/01_schema.sql` through `06_escalation_log.sql` |
| community-service | `wellness_community` | 5337 | `community-service/database/01_schema.sql` |
- auth-service: Dapper with repository pattern (`IUserRepository` / `UserRepository`)
- chat-service: Dapper via stored procedures (`ChatDatabaseProvider`, `SessionDatabaseProvider`)
- notification-service: Raw ADO.NET via `StoredProcedureExecutor` + `DatabaseService`
- journal-service: Raw ADO.NET via `StoredProcedureExecutor` + `DatabaseService`
- community-service: Raw ADO.NET via `CommunityDbService`
- auth-service: SQL scripts mounted as Docker init scripts
- notification-service, journal-service, community-service: `DatabaseInitializer` class runs on startup to ensure schema exists
- chat-service: SQL scripts mounted as Docker init scripts
## Caching Strategy
- **Redis:** Used by chat-service only, configured via `StackExchangeRedis` (`IDistributedCache`)
- **In-memory cache:** auth-service uses `AddMemoryCache()` for rate limiting state
## Authentication & Authorization Flow
### JWT Configuration
- **Issuer:** `AIWellness`
- **Audience:** `AIWellnessUsers`
- **Signing:** SymmetricSecurityKey from `Jwt:Key` environment variable
- **Expiry:** 60 minutes (configurable via `Jwt:ExpiryInMinutes`)
- **Token generation:** `JwtService` (`auth-service/Services/JwtService.cs`)
- **Claims:** `ClaimTypes.NameIdentifier` (userId), `ClaimTypes.Email` (email)
### Password Security
- Hashing: BCrypt.Net-Next (`auth-service/Services/AuthService.cs`)
- Password policy: Configurable in `auth-service/appsettings.json` under `PasswordPolicy` (min 8 chars, uppercase, lowercase, digit, special char)
- Validation: `PasswordValidator` service (`auth-service/Services/PasswordValidator.cs`)
- Account lockout: 5 failed attempts, 15 minute lockout
### Rate Limiting
- auth-service: `RateLimitingMiddleware` (`auth-service/Middleware/RateLimitingMiddleware.cs`) - 100 req/min general, 5 login attempts/min
- AI-Wrapper-Service: `RateLimitingMiddleware` (`AI-Wrapper-Service/AIWrapperService/Middleware/RateLimitingMiddleware.cs`) - configurable via `AiService:RateLimitPerMinute` (default 60)
- AI-Wrapper-Service: `InternalApiKeyMiddleware` (`AI-Wrapper-Service/AIWrapperService/Middleware/InternalApiKeyMiddleware.cs`) validates `X-Internal-Api-Key`
### Two-Factor Authentication
- Codes sent via notification-service (email/push)
- Auth-service calls notification-service at `/api/notifications/send-code` with `X-Internal-Api-Key`
- Delivery: Email (SendGrid SMTP) or Expo Push API
- Verification: `AuthController.VerifyTwoFactor()` validates code, returns JWT on success
## Key Design Decisions
### Gateway Pattern (YARP)
### Database-per-Service
### Stored Procedures
### Frontend API Normalization
### No Shared Authentication for Internal Services
### Push Notifications
- Primary: Expo Push API (`ExpoPushService` in notification-service) - works with Expo Go
- Secondary: Firebase (`FirebaseService`) - initialized but optional, gracefully skipped if unconfigured
- Background scheduler: `NotificationScheduler` hosted service sends wellness tips at configured intervals
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
