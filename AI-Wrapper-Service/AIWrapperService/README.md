# AI Wrapper Service

A stateless HTTP API that normalizes LLM requests/responses for the AI Wellness Platform. Built with .NET 9, following SOLID principles and production-ready practices.

## Features

- **Stateless Design**: No database, pure HTTP API
- **Provider Abstraction**: Easy to swap OpenAI for custom/fine-tuned models
- **Security**: Internal API key authentication, rate limiting
- **Resilience**: Timeouts, upstream error handling
- **Observability**: Structured logging with metadata (no PII)
- **RFC-7807 Errors**: Standard ProblemDetails for all errors
- **Versioned API**: Path-based versioning (/v1)
- **Wellness Prompting**: Default system prompt for supportive, safety-aware responses

## Quick Start

### 1. Configuration

Copy `.env.template` to `.env` and fill in your values:

```bash
cp .env.template .env
```

Edit `.env`:
```env
OPENAI__APIKEY=sk-your-actual-openai-key
AISERVICE__INTERNALAPIKEY=your-shared-secret-key
```

### 2. Run the Service

```bash
dotnet run
```

The service will start on `http://localhost:5160` (or the port in `launchSettings.json`).

### 3. Test Health Endpoint

```bash
curl http://localhost:5160/health
```

Expected response:
```json
{
  "status": "Healthy"
}
```

### 4. Call Chat Completion

```bash
curl -X POST http://localhost:5160/v1/chat/complete \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-shared-secret-key" \
  -d '{
    "sessionId": "sess_12345",
    "messages": [
      {"role": "user", "content": "I am feeling stressed today"}
    ],
    "temperature": 0.7
  }'
```

Expected response:
```json
{
  "sessionId": "sess_12345",
  "model": "gpt-4o-mini",
  "reply": "I hear that you're feeling stressed...",
  "promptTokens": 120,
  "completionTokens": 45
}
```

## API Documentation

### Endpoints

#### `GET /health`
- **Authentication**: None
- **Response**: 200 OK with health status

#### `POST /v1/chat/complete`
- **Authentication**: X-Internal-API-Key header required
- **Request Body**:
  ```json
  {
    "sessionId": "string (required)",
    "messages": [
      {
        "role": "system|user|assistant",
        "content": "string (required)"
      }
    ],
    "model": "string (optional, defaults to gpt-4o-mini)",
    "temperature": 0.7 (0.0-1.0, optional)
  }
  ```
- **Response**: 200 OK with ChatResponseDto
- **Errors**:
  - 400 Bad Request: Validation failed
  - 401 Unauthorized: Missing/invalid API key
  - 429 Too Many Requests: Rate limit exceeded
  - 502 Bad Gateway: Upstream provider error

### Swagger UI

In development mode, access Swagger UI at: `http://localhost:5160`

## Architecture

### Folder Structure

```
AIWrapperService/
├── APIs/              # HTTP endpoints (Minimal APIs)
├── Controllers/       # (Empty - using minimal APIs)
├── DTOs/              # Data transfer objects
├── Enums/             # Enumerations (Role)
├── Entities/          # (Placeholder for future DB entities)
├── Interfaces/        # Service abstractions (IOpenAIChatService)
├── Middleware/        # Custom middleware (auth, rate limiting)
├── Services/          # Business logic (OpenAIChatService)
├── Properties/        # Launch settings
├── Program.cs         # Application entry point
├── GlobalUsings.cs    # Global using directives
├── appsettings.json   # Configuration
└── .env               # Secrets (not committed)
```

### Key Components

- **ChatApi**: Handles /v1/chat/complete, validation, error mapping
- **OpenAIChatService**: Calls OpenAI API, includes Prompting region with wellness buddy system prompt
- **InternalApiKeyMiddleware**: Enforces X-Internal-API-Key for /v1/** routes
- **RateLimitingMiddleware**: Simple in-memory rate limiting (60 req/min per IP)

### Prompting

The service includes a default wellness buddy system prompt in `OpenAIChatService.cs` (lines 150-198). The prompt:
- Provides concise, empathetic responses
- Is safety-aware (recognizes crisis, recommends professional help)
- Avoids medical diagnosis
- Can be overridden by sending a system message in the request

## Configuration

### appsettings.json

```json
{
  "OpenAI": {
    "BaseUrl": "https://api.openai.com/v1/"
  },
  "AiService": {
    "RateLimitPerMinute": 60
  }
}
```

### Environment Variables (.env)

- `OPENAI__APIKEY`: OpenAI API key (required)
- `OPENAI__BASEURL`: OpenAI base URL (optional, defaults to https://api.openai.com/v1/)
- `AISERVICE__INTERNALAPIKEY`: Shared secret for service authentication (required)
- `AISERVICE__RATELIMITPERMINUTE`: Requests per minute per IP (optional, defaults to 60)

## Acceptance Checks

- [x] GET /health → 200 OK
- [x] POST /v1/chat/complete with valid request + API key → 200 with reply, model, token counts
- [x] Missing/invalid X-Internal-API-Key → 401 with ProblemDetails
- [x] Empty messages / invalid role → 400 with ProblemDetails
- [x] Missing OpenAI API key → 502 with ProblemDetails
- [x] Upstream error → 502 with ProblemDetails
- [x] Provider swap readiness: Implement IOpenAIChatService with different provider

## Provider Swap Example

To replace OpenAI with a custom provider:

1. Implement `IOpenAIChatService` with your provider logic
2. Update DI registration in `Program.cs`:
   ```csharp
   builder.Services.AddHttpClient<IOpenAIChatService, CustomProviderService>();
   ```
3. No changes needed to DTOs, APIs, or middleware

## Security Notes

- Never commit `.env` file (already in .gitignore)
- The service logs metadata only (session ID, latency, token counts) - never message content or PII
- Rate limiting is in-memory; use Redis/distributed cache for production scale
- Internal API key is a shared secret; rotate regularly
- For production, add HTTPS enforcement, CORS policies, and network-level security

## Development

### Build

```bash
dotnet build
```

### Run

```bash
dotnet run
```

### Test with Swagger

Navigate to `http://localhost:5160` in development mode.

## Next Steps

- Add integration tests
- Implement distributed rate limiting (Redis)
- Add metrics/telemetry (Application Insights, Prometheus)
- Implement circuit breaker for upstream calls
- Add request/response caching where appropriate
