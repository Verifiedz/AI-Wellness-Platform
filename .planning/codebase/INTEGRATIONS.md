# External Integrations

**Analysis Date:** 2026-03-25

## APIs & External Services

**OpenAI Chat Completions:**
- Service: OpenAI gpt-4o-mini API
- Used by: `AI-Wrapper-Service/`
- Implementation: `AI-Wrapper-Service/AIWrapperService/Services/OpenAIChatService.cs`
- Base URL: `https://api.openai.com/v1/`
- Auth: Bearer token via `OpenAI:ApiKey` environment variable
- Endpoints: POST /chat/completions

**Firebase Cloud Messaging:**
- Service: Firebase Admin SDK (FirebaseAdmin 3.4.0)
- Used by: `notification-service/` (via `NotificationService.Api.csproj`)
- Purpose: Push notifications to mobile devices
- Config: Firebase service account credentials (env-based)

## Data Storage

**Databases:**
- PostgreSQL 16
  - Auth Database: `authdb` (port 5434) - `auth-service/Database/`
  - Chat Database: `chatservicedb` (port 5435) - `chat-service/Database/Scripts/`
  - Journal Database: `wellness_journal` (port 5436) - `journal-service/database/`
  - Notification Database: `wellness_notifications` (port 5433) - `notification-service/database/`
  - Client: Npgsql (raw SQL + stored procedures, Dapper ORM)

**Caching:**
- Redis 7-alpine
  - Connection: `redis-cache:6379` with password auth
  - Used by: `chat-service/` for session caching
  - Client: StackExchange.Redis via Microsoft.Extensions.Caching.StackExchangeRedis
  - Instance prefix: `AIWellness_`

**File Storage:**
- Local filesystem only (no S3, Blob Storage, etc.)
- Expo secure storage for credential caching on mobile

## Authentication & Identity

**Auth Provider:** Custom JWT-based
- Implementation: `auth-service/Services/JwtService.cs`
- Token signing: HS256 with shared secret (`Jwt:Key`)
- Issuer: "AIWellness"
- Audience: "AIWellnessUsers"
- Expiry: Configurable (default 60 minutes)
- Password storage: BCrypt hashing

**Frontend Auth Storage:**
- Expo Secure Store (`expo-secure-store`) for tokens
- Async Storage for non-sensitive data

## Service-to-Service Communication

**API Gateway/Reverse Proxy:**
- Implementation: Yarp.ReverseProxy 2.2.0 in `auth-service/`
- Routes defined in `auth-service/appsettings.json` ReverseProxy config
- Routes:
  - `/chat/{**catch-all}` -> `http://chat-service:8080/`
  - `/api/notifications/{**catch-all}` -> `http://notification-service:8080/`
  - `/api/journal/{**catch-all}` -> `http://journal-service:8080/`
- Auth: JWT validation before forwarding
- Headers: `X-User-Id`, `X-User-Email` propagated downstream

**Internal Service Calls:**
- Auth service -> Notification service (HTTP)
- Chat service -> AI Wrapper service (HTTP)
- All services use internal API keys: `ChatService:ApiKey`, `NotificationService:ApiKey`

## Webhooks & Callbacks

**Incoming:** None detected

**Outgoing:**
- Notification service sends verification codes to mobile via Firebase

## Environment Configuration

**Required environment variables:**
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_KEY` - JWT signing secret
- `AUTH_DB_PASSWORD`, `CHAT_DB_PASSWORD`, `JOURNAL_DB_PASSWORD`, `NOTIFICATION_DB_PASSWORD` - Database passwords
- `REDIS_PASSWORD` - Redis authentication
- `AI_INTERNAL_API_KEY` - Inter-service authentication
- `NOTIFICATION_INTERNAL_API_KEY` - Notification service auth
- `JOURNAL_INTERNAL_API_KEY` - Journal service auth
- `CORS_ORIGIN_0` - Allowed frontend origin

**Secrets location:** Environment variables only (see `docker-compose.yml` for structure)

## CI/CD & Deployment

**Hosting:** Docker containers (docker-compose orchestration)
- Base images: `mcr.microsoft.com/dotnet/aspnet:9.0`
- Services run on internal port 8080
- External ports: 5051 (auth), 5050 (chat), 8081 (ai-wrapper), 8082 (notification), 8083 (journal)

**CI Pipeline:** Not detected (no GitHub Actions, Azure Pipelines, etc.)
