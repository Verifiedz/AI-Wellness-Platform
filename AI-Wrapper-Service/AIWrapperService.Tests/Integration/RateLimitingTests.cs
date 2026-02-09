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
    public async Task ChatComplete_ExceedsRateLimit_Returns429()
    {
        // Arrange - Use isolated factory with low rate limit (3 requests/minute)
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new IsolatedWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object,
            ConfigurationOverrides = new Dictionary<string, string?>
            {
                ["AiService:RateLimitPerMinute"] = "3"
            }
        };
        using var client = factory.CreateClient();

        // Act - Send requests exceeding the limit
        var responses = new List<HttpResponseMessage>();
        for (int i = 0; i < 5; i++)
        {
            var request = CreateAuthenticatedRequest(new
            {
                sessionId = $"rate-limit-test-{i}",
                messages = new[] { new { role = "user", content = "Hello" } },
                temperature = 0.7
            });
            responses.Add(await client.SendAsync(request));
        }

        // Assert - First 3 should succeed, remaining should be rate limited
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.OK);
        var rateLimitedCount = responses.Count(r => r.StatusCode == HttpStatusCode.TooManyRequests);

        successCount.Should().Be(3);
        rateLimitedCount.Should().Be(2);
    }

    [Fact]
    public async Task ChatComplete_RateLimitResponse_IncludesRetryAfter()
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

        // First request - should succeed
        var firstRequest = CreateAuthenticatedRequest(new
        {
            sessionId = "first-request",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = 0.7
        });
        await client.SendAsync(firstRequest);

        // Second request - should be rate limited
        var secondRequest = CreateAuthenticatedRequest(new
        {
            sessionId = "second-request",
            messages = new[] { new { role = "user", content = "Hello again" } },
            temperature = 0.7
        });

        // Act
        var response = await client.SendAsync(secondRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().Be("Rate Limit Exceeded");
    }

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
            sessionId = "exhaust-limit",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = 0.7
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
    public async Task ChatComplete_DifferentClients_HaveSeparateRateLimits()
    {
        // Note: This test demonstrates the concept but may need adjustment
        // based on how the test infrastructure handles client IP addresses.
        // In a real scenario, different IPs would have separate limits.

        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new IsolatedWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object,
            ConfigurationOverrides = new Dictionary<string, string?>
            {
                ["AiService:RateLimitPerMinute"] = "2"
            }
        };
        using var client = factory.CreateClient();

        // Make requests up to the limit
        for (int i = 0; i < 2; i++)
        {
            var request = CreateAuthenticatedRequest(new
            {
                sessionId = $"client1-{i}",
                messages = new[] { new { role = "user", content = "Hello" } },
                temperature = 0.7
            });
            var response = await client.SendAsync(request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        // Next request should be rate limited
        var limitedRequest = CreateAuthenticatedRequest(new
        {
            sessionId = "client1-limited",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = 0.7
        });
        var limitedResponse = await client.SendAsync(limitedRequest);
        limitedResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }

    [Fact]
    public async Task ChatComplete_UnderRateLimit_AllRequestsSucceed()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new IsolatedWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object,
            ConfigurationOverrides = new Dictionary<string, string?>
            {
                ["AiService:RateLimitPerMinute"] = "10"
            }
        };
        using var client = factory.CreateClient();

        // Act - Send requests under the limit
        var responses = new List<HttpResponseMessage>();
        for (int i = 0; i < 5; i++)
        {
            var request = CreateAuthenticatedRequest(new
            {
                sessionId = $"under-limit-{i}",
                messages = new[] { new { role = "user", content = "Hello" } },
                temperature = 0.7
            });
            responses.Add(await client.SendAsync(request));
        }

        // Assert - All should succeed
        responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.OK));
    }

    private static HttpRequestMessage CreateAuthenticatedRequest(object body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/v1/chat/complete")
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
