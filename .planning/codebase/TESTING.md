# Testing Patterns

**Analysis Date:** 2026-03-25

## Test Framework

**C# Backend:**
- Runner: xUnit 2.9.2
- Config: `AIWrapperService.Tests/AIWrapperService.Tests.csproj`
- Assertion Library: FluentAssertions 8.8.0
- Mocking: Moq 4.20.72
- Coverage: coverlet.collector 6.0.2
- Integration Testing: Microsoft.AspNetCore.Mvc.Testing 9.0.0

**Frontend (JavaScript/React Native):**
- No test framework configured (none found in `package.json` or source)
- No test files in `src/` directory
- Testing not implemented at this time

## C# Test Run Commands

```bash
# Run all tests (from project root or Test project directory)
dotnet test

# Run with coverage report
dotnet test /p:CollectCoverage=true /p:CoverageFormat=opencover

# Run specific test class
dotnet test --filter "AIWrapperService.Tests.Unit.Services.OpenAIChatServiceTests"

# Watch mode (requires external tool or IDE)
# Use Visual Studio Test Explorer or Rider's built-in test runner
```

## Test File Organization

**Location (C#):**
- Separate test project alongside source: `AIWrapperService.Tests/` parallel to `AIWrapperService/`
- Structure mirrors source: `AIWrapperService.Tests/Unit/Services/`, `AIWrapperService.Tests/Integration/`

**Naming (C#):**
- Test classes: `{SubjectClass}Tests.cs`
  - `OpenAIChatServiceTests.cs` for unit tests of `OpenAIChatService`
  - `ChatApiCompletionTests.cs` for integration tests of Chat API
  - `ChatApiAuthenticationTests.cs` for authentication-specific tests
- Test methods: `{MethodUnderTest}_{Scenario}_{ExpectedOutcome}`
  - `ChatComplete_WithValidRequest_Returns200WithResponse()`
  - `Constructor_WhenApiKeyMissing_ThrowsInvalidOperationException()`

**Directory Structure:**
```
AIWrapperService.Tests/
├── Unit/
│   ├── APIs/
│   │   └── ChatApiValidationTests.cs
│   └── Services/
│       └── OpenAIChatServiceTests.cs
├── Integration/
│   ├── ChatApiAuthenticationTests.cs
│   ├── ChatApiCompletionTests.cs
│   ├── ChatApiErrorHandlingTests.cs
│   ├── ChatApiValidationIntegrationTests.cs
│   ├── HealthCheckTests.cs
│   └── RateLimitingTests.cs
├── Fixtures/
│   ├── CustomWebApplicationFactory.cs
│   ├── IsolatedWebApplicationFactory.cs
│   ├── TestHelpers.cs
│   └── GlobalUsings.cs
└── GlobalUsings.cs
```

## Test Structure

**Arrange-Act-Assert (AAA) Pattern:**

All tests follow consistent structure:

```csharp
[Fact]
public async Task SendMessage_WithValidInput_ReturnsSuccess()
{
    // Arrange - Setup test data and mocks
    var mockHandler = CreateMockOpenAIHandler();
    using var factory = new CustomWebApplicationFactory<Program>
    {
        MockHttpHandler = mockHandler.Object
    };
    using var client = factory.CreateClient();

    var request = new
    {
        chatUserId = Guid.NewGuid(),
        messageRequest = "Hello",
        Context = "",
        sessionId = Guid.NewGuid()
    };

    // Act - Execute the operation under test
    var response = await client.SendAsync(
        CreateAuthenticatedRequest(request)
    );

    // Assert - Verify expected outcomes
    response.StatusCode.Should().Be(HttpStatusCode.OK);
    var result = await response.Content.ReadFromJsonAsync<ChatResponse>();
    result.Should().NotBeNull();
    result!.message.Should().NotBeNullOrEmpty();
}
```

**Test Attributes:**
- `[Fact]` - Single-execution test
- `[Theory]` - Not used in codebase
- No parameterized tests observed

## Unit Tests (C#)

**Scope:** Testing individual methods in isolation with mocks

**Example: `OpenAIChatServiceTests.cs`**

Location: `AI-Wrapper-Service/AIWrapperService.Tests/Unit/Services/OpenAIChatServiceTests.cs`

Tests the core business logic:
```csharp
[Fact]
public async Task GetChatResponseAsync_WithValidRequest_ReturnsSuccessfulResponse()
{
    // Arrange
    var mockHandler = TestHelpers.CreateMockHttpHandler();
    var httpClient = new HttpClient(mockHandler.Object);
    var config = TestHelpers.CreateTestConfig();
    var logger = new Mock<ILogger<OpenAIChatService>>().Object;
    var service = new OpenAIChatService(httpClient, config, logger);

    var request = TestHelpers.CreateTestChatRequest();

    // Act
    var result = await service.GetChatResponseAsync(request);

    // Assert
    result.Should().NotBeNull();
    result.chatUserId.Should().NotBeEmpty();
    result.message.Should().NotBeEmpty();
}
```

Coverage:
- Constructor validation and initialization
- Happy path responses
- Preserving request metadata (sessionId, chatUserId, context)
- Exception handling and error responses

## Integration Tests (C#)

**Scope:** Full request/response flow through middleware, API layer, and service layer

**Key Test Suites:**

**ChatApiCompletionTests:**
- Location: `AI-Wrapper-Service/AIWrapperService.Tests/Integration/ChatApiCompletionTests.cs`
- Tests successful chat completion scenarios
- Validates metadata preservation across layers
- Tests session ID generation and preservation

**ChatApiAuthenticationTests:**
- Tests X-Internal-API-Key validation
- Missing key returns 401
- Invalid key returns 401
- Valid key allows request to proceed
- Empty key rejected

**ChatApiErrorHandlingTests:**
- Location: `AI-Wrapper-Service/AIWrapperService.Tests/Integration/ChatApiErrorHandlingTests.cs`
- Tests upstream failures map to correct HTTP status codes
- OpenAI 500 → Service returns 502 BadGateway
- OpenAI 401 → Service returns 502 BadGateway
- OpenAI 503 → Service returns 502 BadGateway
- Timeout → Service returns 504 GatewayTimeout
- Connection failure → Service returns 502 BadGateway
- Invalid JSON response → Service returns 500 or 502
- All error responses include traceId for debugging
- All error responses include instance path

**ChatApiValidationIntegrationTests:**
- Request validation at HTTP layer
- Empty messageRequest → 400 BadRequest
- Missing sessionId → 400 BadRequest
- Invalid chatUserId (Guid.Empty) → 400 BadRequest

**RateLimitingTests:**
- Tests rate limiting middleware

**HealthCheckTests:**
- Tests health check endpoint

## Mocking

**Framework:** Moq 4.20.72

**HTTP Mocking Pattern:**

Creating mock HTTP handlers for external OpenAI API:

```csharp
private static Mock<HttpMessageHandler> CreateMockOpenAIHandler()
{
    var responseContent = """
    {
        "choices": [{
            "message": {
                "content": "I understand you're feeling stressed..."
            }
        }],
        "usage": {
            "prompt_tokens": 150,
            "completion_tokens": 95
        },
        "model": "gpt-4o-mini"
    }
    """;

    var mockHandler = new Mock<HttpMessageHandler>();
    mockHandler
        .Protected()
        .Setup<Task<HttpResponseMessage>>(
            "SendAsync",
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>())
        .ReturnsAsync(new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent(responseContent)
        });

    return mockHandler;
}
```

Location: Test helpers in `AIWrapperService.Tests/Fixtures/TestHelpers.cs`

**Mocking Logger:**

```csharp
var logger = new Mock<ILogger<OpenAIChatService>>().Object;
// Mocks suppress logging output in tests
```

**What to Mock:**
- External HTTP calls (OpenAI API)
- HttpClient and HttpMessageHandler
- ILogger (suppress output, optional)
- IConfiguration for test-specific settings

**What NOT to Mock:**
- Middleware (test through full pipeline with WebApplicationFactory)
- Validation logic (test with real inputs)
- Service business logic (test with minimal mocks)
- Database providers (create real instances with test data)

## Fixtures and Factories

**CustomWebApplicationFactory:**

Location: `AIWrapperService.Tests/Fixtures/CustomWebApplicationFactory.cs`

Creates a fresh ASP.NET Core test host for each test:

```csharp
public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram>
    where TProgram : class
{
    public HttpMessageHandler? MockHttpHandler { get; set; }
    public Dictionary<string, string?>? ConfigurationOverrides { get; set; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            var testConfig = new Dictionary<string, string?>
            {
                ["OpenAI:ApiKey"] = "test-openai-key-12345",
                ["OpenAI:BaseUrl"] = "https://api.openai.com/v1/",
                ["AiService:InternalApiKey"] = "test-internal-key-123",
                ["AiService:RateLimitPerMinute"] = "60"
            };
            // ... apply overrides
        });

        builder.ConfigureServices(services =>
        {
            // Replace HttpClient handler with mock
            if (MockHttpHandler != null)
            {
                // ... configure mock
            }
        });
    }
}
```

Usage pattern:
```csharp
using var factory = new CustomWebApplicationFactory<Program>
{
    MockHttpHandler = mockHandler.Object
};
using var client = factory.CreateClient();
```

**IsolatedWebApplicationFactory:**

Like CustomWebApplicationFactory but used for tests requiring state isolation (e.g., rate limiting tests).

Creates completely fresh instance for each test.

**TestHelpers:**

Location: `AIWrapperService.Tests/Fixtures/TestHelpers.cs`

Static utility methods for common test setup:

```csharp
public static IConfiguration CreateTestConfig(Dictionary<string, string?>? settings = null)
{
    var defaultSettings = new Dictionary<string, string?>
    {
        ["OpenAI:ApiKey"] = "test-key-12345",
        ["OpenAI:BaseUrl"] = "https://api.openai.com/v1/",
        ["AiService:InternalApiKey"] = "test-internal-key-123"
    };
    // Merge with overrides and return
}

public static ChatRequest CreateTestChatRequest(
    Guid? chatUserId = null,
    string? messageRequest = null,
    string context = "",
    Guid? sessionId = null)
{
    return new ChatRequest(
        chatUserId: chatUserId ?? Guid.NewGuid(),
        messageRequest: messageRequest ?? "I feel stressed today",
        Context: context,
        sessionId: sessionId ?? Guid.NewGuid()
    );
}
```

## Coverage

**Target:** 80%+ (as per development standards)

**Running Coverage Report:**

```bash
dotnet test /p:CollectCoverage=true /p:CoverageFormat=opencover
```

Coverage data collected with coverlet.collector (6.0.2).

**Measured Coverage:**

Test project includes 11 test classes covering:
- Unit tests for OpenAIChatService (5 tests)
- Integration tests for Chat API (6+ suites, 30+ tests total)
- Test coverage spans happy path, validation, error handling, authentication

**What's Covered:**
- Service request/response normalization
- Error handling and HTTP status code mapping
- Request validation (required fields, format)
- Authentication middleware
- Rate limiting
- Health checks
- Session management and message preservation

## Test Data and Factories

**Common Test Data:**

Guids for user and session tracking:
```csharp
var chatUserId = Guid.NewGuid();
var sessionId = Guid.NewGuid();
```

Sample chat messages:
```csharp
messageRequest = "I feel stressed today"
messageRequest = "Hello"
```

OpenAI mock responses:
```json
{
    "choices": [{
        "message": {
            "content": "I understand you're feeling stressed..."
        }
    }],
    "usage": {
        "prompt_tokens": 150,
        "completion_tokens": 95
    },
    "model": "gpt-4o-mini"
}
```

## Test Execution Workflow

1. **Arrange Phase:**
   - Create test factory with optional mocks
   - Build HTTP client from factory
   - Create test request with known data
   - Set up any middleware overrides

2. **Act Phase:**
   - Call API endpoint via HTTP client
   - Async operations awaited
   - Service business logic executed

3. **Assert Phase:**
   - FluentAssertions chains: `.Should().Be()`, `.Should().NotBeNull()`, `.Should().Contain()`
   - Verify HTTP status codes
   - Deserialize and validate response content
   - Check for expected exceptions

## Async Testing

All async tests use `async Task` with `await`:

```csharp
[Fact]
public async Task SomeAsyncTest()
{
    // Arrange
    var result = await service.GetAsync();
    // Assert
}
```

Cancellation tokens handled:
```csharp
public async Task GetChatResponseAsync(ChatRequest req, CancellationToken ct = default)
```

Tests use default CancellationToken when not testing timeout scenarios.

## Error Testing

Testing specific exception types:

```csharp
[Fact]
public async Task GetChatResponseAsync_WhenOpenAIReturnsError_ThrowsHttpRequestException()
{
    // Arrange
    var mockHandler = TestHelpers.CreateMockHttpHandlerWithError(
        HttpStatusCode.Unauthorized,
        @"{""error"": {""message"": ""Invalid API key""}}");

    // Act & Assert
    await Assert.ThrowsAsync<HttpRequestException>(() => service.GetChatResponseAsync(request));
}
```

Testing constructor validation (fail-fast):

```csharp
[Fact]
public void Constructor_WhenApiKeyMissing_ThrowsInvalidOperationException()
{
    // Act & Assert
    var exception = Assert.Throws<InvalidOperationException>(() =>
        new OpenAIChatService(httpClient, config, logger));
    exception.Message.Should().Contain("OpenAI:ApiKey is not configured");
}
```

## Frontend Testing Status

**Current State:** No frontend tests implemented.

**Recommended Future Setup:**
- Framework: Jest or Vitest
- React Native Testing Library
- Add test scripts to `frontend/package.json`
- Location: `frontend/src/**/*.test.js` (co-located with components)

---

*Testing analysis: 2026-03-25*
