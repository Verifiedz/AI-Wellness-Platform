# Coding Conventions

**Analysis Date:** 2026-03-25

## Naming Patterns

**Files (C#):**
- PascalCase for class files: `OpenAIChatService.cs`, `ChatRequest.cs`, `InternalApiKeyMiddleware.cs`
- DTOs placed in `DTOs/` directory: `ChatRequest.cs`, `ChatResponse.cs`, `ChatHistoryItem.cs`
- Interfaces prefixed with `I`: `IOpenAIChatService.cs`, `IChatService.cs`
- Services suffixed with `Service`: `OpenAIChatService.cs`, `chatService.cs`

**Files (JavaScript/React Native):**
- camelCase for utilities and services: `chatApi.js`
- PascalCase for components (screens): `AIChatScreen.js`
- camelCase for context: `AuthContext.js`, `ThemeContext.js`

**Classes (C#):**
- PascalCase: `OpenAIChatService`, `ChatRequest`, `CustomWebApplicationFactory`
- Sealed classes when inheritance not needed: `sealed class OpenAIChatService`
- Record types for immutable DTOs: `public sealed record ChatRequest(...)`

**Functions (C#):**
- PascalCase for public methods: `GetChatResponseAsync()`, `SendChatMessageAsync()`
- Async methods suffixed with `Async`: `GetChatResponseAsync()`, `InvokeAsync()`
- Private static methods are lowercase (static helper): `ValidateRequest()`, `CreateMockHttpHandler()`

**Functions (JavaScript):**
- camelCase for all functions: `sendMessage()`, `loadHistory()`, `normalizeMessage()`
- useCallback hooks for memoized callbacks: `useCallback(async () => {...}, [])`
- Getter functions prefixed with `create` or `get`: `CreateAuthenticatedRequest()`, `formatMessageTime()`

**Variables (C#):**
- PascalCase for public properties: `ChatUserId`, `MessageRequest`
- camelCase for private fields prefixed with underscore: `_http`, `_logger`, `_sessionService`
- Readonly fields for dependency injection: `private readonly HttpClient _http`
- Constants in UPPER_SNAKE_CASE: `DefaultModel`, `TimeoutSeconds`, `SystemPrompt`, `ApiKeyHeader`

**Variables (JavaScript):**
- camelCase for all variables: `inputText`, `messageText`, `isLoading`, `error`
- Boolean variables prefixed with `is`, `has`, `should`: `isLoadingHistory`, `isSending`, `isPending`
- State variables via `useState`: `const [messages, setMessages] = useState([])`

**Types/Interfaces (C#):**
- PascalCase: `ChatRequest`, `ChatResponse`, `IOpenAIChatService`
- Records for immutable value objects: `public sealed record ChatRequest(...)`
- Null-conditional operators: `request?.params`

## Code Style

**Formatting (C#):**
- Allman-style braces (opening brace on new line)
- 4-space indentation
- Line length: no strict limit observed, but generally <120 chars
- Blank lines separate logical sections within methods

**Formatting (JavaScript):**
- 2-space indentation (React Native convention)
- Implicit formatting (no enforced linter config found)
- Line length: typically <100 characters

**Linting (C#):**
- Nullable reference types enabled: `<Nullable>enable</Nullable>` in .csproj
- Implicit usings enabled: `<ImplicitUsings>enable</ImplicitUsings>`
- Global using statements in `GlobalUsings.cs` for common imports

**Linting (JavaScript):**
- No `.eslintrc` or `.prettierrc` at project root (not enforced)
- Expo + React Native conventions followed implicitly
- No formatter configuration detected in frontend package.json

## Import Organization

**C# Order (via GlobalUsings.cs):**
1. Framework namespaces (Microsoft.AspNetCore, Microsoft.Extensions)
2. System namespaces (System, System.Diagnostics, System.Net, etc.)
3. Project namespaces (AIWrapperService.DTOs, AIWrapperService.Interfaces)
4. Specific local imports when needed

Example from `GlobalUsings.cs`:
```csharp
// Common ASP.NET Core namespaces
global using Microsoft.AspNetCore.Builder;
global using Microsoft.AspNetCore.Http;
// ... more System and project namespaces
```

**JavaScript Order:**
1. React/React Native core imports
2. Navigation libraries
3. Local services and utilities
4. Constants

Example from `AIChatScreen.js`:
```javascript
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ... } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useAuth } from "../context/AuthContext";
import { chatApi } from "../services/chatApi";
```

**Path Aliases:**
- No aliases detected in frontend (direct relative imports used)
- Absolute imports in C# via namespaces

## Error Handling

**C# Pattern (Explicit try-catch):**
- Catches specific exception types first, general exceptions last
- Logs full exception context with structured logging
- Returns RFC-7807 ProblemDetails format for HTTP errors
- Never swallows errors silently

Example from `OpenAIChatService.cs`:
```csharp
try
{
    // ... operation
}
catch (HttpRequestException ex)
{
    _logger.LogError(ex, "Upstream provider failed for request {RequestId}", requestId);
    throw;  // Re-throw, don't swallow
}
catch (Exception ex)
{
    _logger.LogError(ex, "Unexpected error in GetChatResponseAsync for request {RequestId}", requestId);
    throw;
}
```

**JavaScript Pattern (Promise chains with .then().catch()):**
- Async/await with try-catch not used
- Errors handled via result object: `{ error, data }`
- Errors set in component state: `setError(result.error || "message")`
- No explicit throwing, errors wrapped in response objects

Example from `chatApi.js`:
```javascript
return apiClient.get(`${BASE_PATH}/sessions`).then((result) => {
    if (result.error || !result.data) return result;
    // ... normalize and return
});
```

Example from `AIChatScreen.js`:
```javascript
if (response.error || !response.data) {
    setError(response.error || "Failed to send message.");
    setIsSending(false);
    return;
}
```

**Validation Pattern:**
- Input validation at system boundaries (controllers, service methods)
- Guards at start of functions: `if (string.IsNullOrWhiteSpace(...)) throw new ArgumentException(...)`
- Frontend validates before API calls: `if (!messageText || isSending) return;`

Example from `ChatApi.cs`:
```csharp
var validationErrors = ValidateRequest(request);
if (validationErrors.Any()) {
    return Results.Problem(statusCode: 400, ...);
}
```

## Logging

**Framework (C#):** Microsoft.Extensions.Logging (ILogger interface)

**Patterns:**
- Structured logging with named parameters: `_logger.LogError(ex, "Failed for request {RequestId}", requestId)`
- Never log sensitive data (PII): "never log message content/PII"
- Use log levels appropriately:
  - LogError: Failures, exceptions
  - LogWarning: Validation failures, missing headers
  - LogInformation: Successful operations with metadata

Example from `OpenAIChatService.cs`:
```csharp
_logger.LogInformation(
    "Completed chat for user {ChatUserId}, session {SessionId}. " +
    "Latency: {LatencyMs}ms, RequestId: {RequestId}",
    req.chatUserId,
    req.sessionId,
    (int)elapsedMs,
    requestId);
```

**Frontend (JavaScript):** No explicit logger configured (not observed)

## Comments

**When to Comment (C#):**
- Method-level summaries using XML doc comments (required)
- Inline comments for non-obvious logic
- Section markers: `// ===== Service Registration =====`

**XML Documentation Example:**
```csharp
/// <summary>
/// Sends a chat message to OpenAI and returns the AI-generated response.
/// </summary>
public async Task<ChatResponse> GetChatResponseAsync(ChatRequest req, CancellationToken ct = default)
```

**When NOT to Comment (C#):**
- Self-documenting code preferred over comments
- Names should be clear enough to avoid explanation

**Frontend (JavaScript):**
- Minimal comments (code is generally clear)
- Section comments for complex logic blocks
- No formal JSDoc pattern observed

## Function Design

**Size (C#):**
- Methods typically 20-50 lines
- Longer methods (80+ lines) for integration tests acceptable (data setup)
- Example: `OpenAIChatService.GetChatResponseAsync()` is 99 lines (includes all error handling)

**Parameters (C#):**
- Dependency injection via constructor for services
- Request objects as single parameter for API handlers: `CompleteChatAsync(ChatRequest request, ...)`
- Cancellation tokens as optional last parameter: `CancellationToken ct = default`

**Return Values (C#):**
- Async methods return `Task<T>` or `Task`
- DTOs returned as-is (records): `Task<ChatResponse>`
- IReadOnlyList for collections: `Task<IReadOnlyList<Chat>>`
- Errors thrown as exceptions (not returned)

**Parameters (JavaScript):**
- Objects destructured for named parameters: `({ messageRequest, context = "", sessionId = null })`
- Default parameters in function signature: `fallbackRole = "assistant"`
- Objects for complex payloads

**Return Values (JavaScript):**
- Functions return response objects: `{ error, data }`
- Callbacks return void (side effects via setState)
- Normalization functions return null on invalid input

## Module Design

**Exports (C#):**
- Classes are top-level: `public sealed class OpenAIChatService`
- Interfaces in separate files: `IOpenAIChatService.cs`
- Records for DTOs: `public sealed record ChatRequest(...)`
- Static utility methods: `static class ChatApi` for mapping endpoints
- Global using statements in `GlobalUsings.cs` for common types

**Exports (JavaScript):**
- Named exports for services: `export const chatApi = { ... }`
- Default exports for components: `export function AIChatScreen({ ... })`
- No barrel files (index.js) observed

**Service Encapsulation (JavaScript):**
- API client abstraction: `apiClient.get()`, `apiClient.post()`, `apiClient.patch()`
- Normalization functions wrap API responses: `normalizeMessage()`, `normalizeSession()`
- Services never expose raw HTTP responses

## Constants

**C# Pattern:**
```csharp
private const string DefaultModel = "gpt-4o-mini";
private const int TimeoutSeconds = 30;
private const double DefaultTemperature = 0.7;
private const string ApiKeyHeader = "X-Internal-API-Key";
```

**JavaScript Pattern:**
```javascript
const BASE_PATH = "/chat/chatService/api";
// Constants defined at file scope for service exports
```

## Immutability Patterns

**C# (Records for DTOs):**
```csharp
public sealed record ChatRequest(
    Guid chatUserId,
    string messageRequest,
    string Context,
    Guid? sessionId);
```
Used with `with` expression for immutable updates:
```csharp
var updatedChatRequest = chatRequest with { sessionId = session.sessionID };
```

**JavaScript (Immutable State Updates):**
```javascript
// Spread operator for new arrays/objects
setMessages((prev) => [...prev, optimisticMessage]);
setMessages((prev) =>
  prev.map((item) =>
    item.id === optimisticMessage.id
      ? { ...item, isPending: false, failed: true }
      : item
  )
);
```

---

*Convention analysis: 2026-03-25*
