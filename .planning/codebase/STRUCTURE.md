# Codebase Structure

**Analysis Date:** 2026-03-25

## Directory Layout

```
AI-Wellness-Platform/
├── frontend/                           # React Native Expo mobile application
│   ├── src/
│   │   ├── screens/                   # Screen components
│   │   ├── navigation/                # Navigation stacks and routing
│   │   ├── services/                  # API clients and helpers
│   │   ├── context/                   # React Context providers
│   │   ├── theme/                     # Design tokens and colors
│   │   ├── constants/                 # App constants
│   │   ├── config/                    # Configuration
│   │   └── utils/                     # Utility functions
│   ├── assets/                        # Images, fonts, static files
│   ├── package.json                   # Dependencies (Expo, React, React Native)
│   └── app.json                       # Expo configuration
│
├── auth-service/                      # Authentication & API Gateway (C# .NET 9)
│   ├── Controllers/                   # API endpoints (Auth)
│   ├── Services/                      # Business logic (JWT, password validation, notifications)
│   ├── Repositories/                  # Data access layer
│   ├── Models/                        # Domain entities
│   ├── DTOs/                          # Request/response objects
│   ├── Middleware/                    # Exception handling, CORS, auth
│   ├── Database/                      # Schema and stored procedures
│   ├── Program.cs                     # Dependency injection and middleware setup
│   └── AuthService.csproj             # .NET 9, JWT Bearer, Dapper, YARP
│
├── chat-service/                      # Chat & Session Management (C# .NET 8)
│   ├── ChatService/
│   │   ├── Controllers/               # ChatController API endpoints
│   │   ├── Services/                  # ChatService, SessionService, ConfigService
│   │   ├── APIs/
│   │   │   ├── Providers/            # Database providers (Session, Chat, Cache)
│   │   │   └── Clients/              # HTTP client for AI Wrapper
│   │   ├── Interfaces/                # Service contracts
│   │   ├── DTOs/                      # ChatRequest, ChatResponse, BookmarkRequest
│   │   ├── entities/                  # ChatSession, Chat domain objects
│   │   ├── enums/                     # Status enum
│   │   ├── DependencyInjectionContainer.cs  # Service registration
│   │   ├── Program.cs                 # Entry point
│   │   └── ChatService.csproj         # .NET 8, Npgsql, xUnit, Redis, JWT
│   ├── ChatService.Tests/             # Unit tests
│   ├── Database/
│   │   └── Scripts/
│   │       ├── Tables/                # Schema (sessions, chats, status)
│   │       └── StoreProcedures/       # SP and functions for CRUD
│   └── database/ [sqlite for demo]
│
├── AI-Wrapper-Service/                # OpenAI Integration & Normalization (C# .NET 9)
│   ├── AIWrapperService/
│   │   ├── APis/
│   │   │   └── ChatApi.cs            # Minimal API endpoints (POST /chat/ChatResponse)
│   │   ├── Services/
│   │   │   └── OpenAIChatService.cs  # OpenAI HTTP client with system prompt
│   │   ├── Interfaces/
│   │   │   └── IOpenAIChatService.cs
│   │   ├── DTOs/                      # ChatRequest, ChatResponse, ChatHistoryItem
│   │   ├── Entities/                  # Domain models
│   │   ├── Middleware/                # API Key validation, rate limiting
│   │   ├── Program.cs                 # Swagger, health checks, service setup
│   │   └── AiWrapperService.csproj    # .NET 9, Swagger, ProblemDetails
│   └── AIWrapperService.Tests/        # Integration tests
│
├── journal-service/                   # [Partially implemented] Journal entries
│   ├── src/                           # Source files
│   └── database/                      # Schema
│
├── journal-service-demo/              # Demo/example implementation
│   ├── src/                           # Source files
│   └── package.json                   # Node.js project
│
├── notification-service/              # [Partially implemented] Notifications
│   ├── src/                           # Source files
│   └── database/                      # Schema
│
├── docs/                              # Documentation
└── .planning/
    └── codebase/                      # Codebase analysis documents
```

## Directory Purposes

**frontend/**
- Purpose: React Native mobile application (iOS, Android, Web via Expo)
- Contains: React components, screens, navigation, API clients, context providers
- Key files: `AppNavigator.js` (root), `MainTabs.js` (primary navigation), `chatApi.js` (API client)

**auth-service/**
- Purpose: JWT authentication, user management, API gateway routing
- Contains: C# .NET 9 ASP.NET Core service
- Key files: `Program.cs` (YARP reverse proxy setup), `AuthService.cs` (core logic), `JwtService.cs` (token generation)

**chat-service/ChatService/**
- Purpose: Chat message persistence, session management, conversation state
- Contains: C# .NET 8 ASP.NET Core service with PostgreSQL and Redis
- Key files: `ChatController.cs` (endpoints), `chatService.cs` (orchestration), `SessionService.cs` (caching and CRUD)

**AI-Wrapper-Service/AIWrapperService/**
- Purpose: OpenAI API abstraction and normalization
- Contains: C# .NET 9 ASP.NET Core service with Swagger documentation
- Key files: `ChatApi.cs` (endpoints), `OpenAIChatService.cs` (LLM integration), `Program.cs` (health checks)

**database/ directories (per service)**
- Purpose: SQL schema, stored procedures, migrations
- Location: `auth-service/Database/`, `chat-service/Database/Scripts/`
- Contains: DDL (CREATE TABLE), DML (INSERT/UPDATE/DELETE), stored procedures

## Key File Locations

**Entry Points:**

Frontend:
- `frontend/src/navigation/AppNavigator.js`: Root navigation component (conditional auth vs main tabs)
- `frontend/src/navigation/MainTabs.js`: Primary tab interface (Home, Journal, Chat, Settings)
- `frontend/src/navigation/ChatStack.js`: Chat screen hierarchy
- `frontend/src/screens/AIChatScreen.js`: Chat UI and interaction (15KB)

Auth Service:
- `auth-service/Program.cs`: Dependency injection, YARP proxy configuration, middleware setup

Chat Service:
- `chat-service/ChatService/Program.cs`: Service registration via DependencyInjectionContainer
- `chat-service/ChatService/Controllers/ChatController.cs`: HTTP endpoints (5 endpoints for CRUD)

AI Wrapper:
- `AI-Wrapper-Service/AIWrapperService/Program.cs`: Swagger, health checks, middleware pipeline
- `AI-Wrapper-Service/AIWrapperService/APis/ChatApi.cs`: Single POST endpoint for completions

**Configuration:**

- `frontend/package.json`: Dependencies (React 19, React Native 0.81, Expo 54, React Navigation 7)
- `frontend/src/config/index.js`: Base URLs, API configuration
- `frontend/src/services/api.js`: HTTP client wrapper with authorization
- `auth-service/appsettings.json`: JWT secrets, CORS origins, Notification Service URL
- `chat-service/ChatService/appsettings.json`: Database connection, Redis, Jwt config
- `AI-Wrapper-Service/AIWrapperService/.env`: OpenAI API key (loaded via DotNetEnv)

**Core Logic:**

Frontend:
- `frontend/src/services/chatApi.js`: Chat API client (sendMessage, getSessions, etc.)
- `frontend/src/services/authApi.js`: Auth API client (login, register, verify2FA)
- `frontend/src/context/AuthContext.js`: Authentication state management with SecureStore
- `frontend/src/context/ThemeContext.js`: Light/dark mode management

Auth Service:
- `auth-service/Services/AuthService.cs`: Login, register, password reset logic
- `auth-service/Services/JwtService.cs`: JWT token generation and validation
- `auth-service/Services/PasswordValidator.cs`: Password strength validation
- `auth-service/Repositories/UserRepository.cs`: User CRUD via Dapper

Chat Service:
- `chat-service/ChatService/Services/chatService.cs`: Message sending, history retrieval (140 lines)
- `chat-service/ChatService/Services/SessionService.cs`: Session CRUD with Redis caching (160 lines)
- `chat-service/ChatService/APIs/Providers/SessionDatabaseProvider.cs`: PostgreSQL access via stored procedures
- `chat-service/ChatService/APIs/Providers/ChatDatabaseProvider.cs`: Chat message persistence

AI Wrapper:
- `AI-Wrapper-Service/AIWrapperService/Services/OpenAIChatService.cs`: OpenAI integration with system prompt (180 lines)

**Testing:**

- `chat-service/ChatService.Tests/`: xUnit test project (setup but sparse)
- `AI-Wrapper-Service/AIWrapperService.Tests/`: Integration test project

## Naming Conventions

**Files:**
- PascalCase for .cs files (C#): `ChatController.cs`, `UserRepository.cs`
- camelCase for .js files (JavaScript): `chatApi.js`, `authApi.js`, `authService.js`
- Plurals for collections/namespaces: `Controllers/`, `Services/`, `Repositories/`
- Interface files prefixed with 'I': `ISessionService.cs`, `IChatService.cs`
- Test files: `[Class].Tests.cs` or `[Feature].test.js`

**Directories:**
- Feature-grouped: `chat-service/`, `auth-service/` (by domain)
- Layer-grouped within services: `Controllers/`, `Services/`, `APIs/`, `Interfaces/`, `DTOs/`
- Plural for collections: `screens/`, `services/`, `navigation/`

**Code Conventions:**

C# (.NET services):
- Class names: PascalCase (ChatService, SessionService)
- Method names: PascalCase (SendChatMessageAsync, GetOrCreateSessionAsync)
- Property names: PascalCase (ChatUserId, SessionId)
- Field names: camelCase with underscore prefix (_chatService, _logger)
- Constants: UPPER_SNAKE_CASE (DefaultModel = "gpt-4o-mini", TimeoutSeconds = 30)

JavaScript (Frontend):
- Component names: PascalCase (HomeScreen, AIChatScreen)
- Function names: camelCase (normalizeMessage, normalizeSession)
- Variable names: camelCase (chatUserId, sessionId)
- Constants: UPPER_SNAKE_CASE (AUTH_TOKEN_KEY = "auth_token")

## Where to Add New Code

**New Feature (e.g., mood tracking enhancement):**
- Frontend UI: `frontend/src/screens/NewFeature.js`
- Frontend API: `frontend/src/services/newFeatureApi.js`
- Backend service: `[new-service-name]/Controllers/`, `Services/`
- Database schema: `[new-service-name]/Database/Scripts/Tables/`

**New Component/Module:**
- React component: `frontend/src/components/` or `frontend/src/screens/`
- C# service class: Place in `Services/` directory with matching interface in `Interfaces/`
- Register in dependency injection container: Program.cs or DependencyInjectionContainer.cs

**Utilities:**
- Frontend: `frontend/src/utils/`
- C# shared logic: Create service and register in DI container (not static utilities)

**Database Scripts:**
- Stored procedures: `[service]/Database/Scripts/StoreProcedures/sp_*.sql`
- Schema changes: `[service]/Database/Scripts/Tables/`
- Naming: `sp_[feature]_[action].sql` or `fn_[feature]_[action].sql`

**Tests:**
- Frontend: Not currently established; recommend `[feature].test.js` in same directory
- C# unit tests: `[Service].Tests/` project, mirroring folder structure
- C# integration tests: `[Service].Tests/Integration/`

## Special Directories

**frontend/.expo/**
- Purpose: Expo managed workflow caching and configuration
- Generated: Yes (by Expo CLI)
- Committed: No (.gitignored)

**frontend/node_modules/**
- Purpose: npm dependency installation
- Generated: Yes (npm install)
- Committed: No (.gitignored)

**auth-service/bin/ and obj/**
- Purpose: .NET build output and intermediate files
- Generated: Yes (dotnet build)
- Committed: No (.gitignored)

**docs/**
- Purpose: Documentation and design documents
- Contents: API documentation, architecture diagrams, user guides
- Status: Partially populated

---

*Structure analysis: 2026-03-25*
