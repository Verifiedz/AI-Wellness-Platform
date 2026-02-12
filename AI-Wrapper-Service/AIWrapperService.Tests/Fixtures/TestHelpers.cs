using Moq;
using Moq.Protected;

namespace AIWrapperService.Tests.Fixtures;

/// <summary>
/// Helper utilities for creating test fixtures and mocks.
/// </summary>
public static class TestHelpers
{
    /// <summary>
    /// Creates a test configuration with common default values.
    /// </summary>
    public static IConfiguration CreateTestConfig(Dictionary<string, string?>? settings = null)
    {
        var defaultSettings = new Dictionary<string, string?>
        {
            ["OpenAI:ApiKey"] = "test-key-12345",
            ["OpenAI:BaseUrl"] = "https://api.openai.com/v1/",
            ["AiService:InternalApiKey"] = "test-internal-key-123",
            ["AiService:RateLimitPerMinute"] = "60"
        };

        if (settings != null)
        {
            foreach (var kvp in settings)
            {
                defaultSettings[kvp.Key] = kvp.Value;
            }
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(defaultSettings)
            .Build();
    }

    /// <summary>
    /// Creates a mock HTTP message handler that returns a successful OpenAI response.
    /// </summary>
    public static Mock<HttpMessageHandler> CreateMockHttpHandler(string? responseContent = null)
    {
        responseContent ??= @"{
            ""choices"": [{
                ""message"": {
                    ""content"": ""This is a test response from the wellness buddy.""
                }
            }],
            ""usage"": {
                ""prompt_tokens"": 150,
                ""completion_tokens"": 95
            },
            ""model"": ""gpt-4o-mini""
        }";

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

    /// <summary>
    /// Creates a mock HTTP message handler that returns an error response.
    /// </summary>
    public static Mock<HttpMessageHandler> CreateMockHttpHandlerWithError(
        HttpStatusCode statusCode = HttpStatusCode.BadGateway,
        string? errorContent = null)
    {
        errorContent ??= @"{
            ""error"": {
                ""message"": ""Upstream service error"",
                ""type"": ""api_error"",
                ""code"": ""service_unavailable""
            }
        }";

        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = statusCode,
                Content = new StringContent(errorContent)
            });

        return mockHandler;
    }

    /// <summary>
    /// Creates a test ChatRequest with default values.
    /// </summary>
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
}
