using Microsoft.AspNetCore.Mvc.Testing;
using Moq;
using Moq.Protected;
using Xunit;
using FluentAssertions;
using AIWrapperService.Tests.Fixtures;

namespace AIWrapperService.Tests.Integration;

/// <summary>
/// Integration tests for rate limiting middleware.
/// Tests that requests are properly throttled after exceeding limits.
/// </summary>
public class RateLimitingTests
{
    private const string ValidApiKey = "test-internal-key-123";

    [Fact]
    public async Task HealthEndpoint_NotAffectedByRateLimit()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new IsolatedWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object,
            ConfigurationOverrides = new Dictionary<string, string?>
            {
                ["AiService:RateLimitPerMinute"] = "1"
            }
        };
        using var client = factory.CreateClient();

        // Exhaust rate limit with chat request
        var chatRequest = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "Hello",
            Context = "",
            sessionId = Guid.NewGuid()
        });
        await client.SendAsync(chatRequest);

        // Act - Health check should still work
        var healthResponses = new List<HttpResponseMessage>();
        for (int i = 0; i < 5; i++)
        {
            healthResponses.Add(await client.GetAsync("/health"));
        }

        // Assert - All health checks should succeed
        healthResponses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.OK));
    }

    [Fact]
    public async Task ChatComplete_UnderRateLimit_Succeeds()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new IsolatedWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object,
            ConfigurationOverrides = new Dictionary<string, string?>
            {
                ["AiService:RateLimitPerMinute"] = "100" // High limit
            }
        };
        using var client = factory.CreateClient();

        // Act - Single request under the limit
        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "Hello",
            Context = "",
            sessionId = Guid.NewGuid()
        });
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static HttpRequestMessage CreateAuthenticatedRequest(object body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/chat/ChatResponse")
        {
            Content = JsonContent.Create(body)
        };
        request.Headers.Add("X-Internal-API-Key", ValidApiKey);
        return request;
    }

    private static Mock<HttpMessageHandler> CreateMockOpenAIHandler()
    {
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(() => new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("""
                {
                    "choices": [{"message": {"content": "Test response"}}],
                    "usage": {"prompt_tokens": 10, "completion_tokens": 5},
                    "model": "gpt-4o-mini"
                }
                """)
            });

        return mockHandler;
    }
}
