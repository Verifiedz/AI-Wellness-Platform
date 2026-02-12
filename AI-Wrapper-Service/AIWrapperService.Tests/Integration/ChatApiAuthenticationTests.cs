using Microsoft.AspNetCore.Mvc.Testing;
using Moq;
using Moq.Protected;
using Xunit;
using FluentAssertions;
using AIWrapperService.Tests.Fixtures;

namespace AIWrapperService.Tests.Integration;

/// <summary>
/// Integration tests for API key authentication.
/// Tests the InternalApiKeyMiddleware behavior.
/// </summary>
public class ChatApiAuthenticationTests
{
    [Fact]
    public async Task ChatComplete_WithoutApiKey_Returns401()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Post, "/chat/ChatResponse")
        {
            Content = JsonContent.Create(new
            {
                chatUserId = Guid.NewGuid(),
                messageRequest = "Hello",
                Context = "",
                sessionId = Guid.NewGuid()
            })
        };

        // Act - No X-Internal-API-Key header
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().Be("Authentication Required");
        problemDetails.Detail.Should().Contain("X-Internal-API-Key");
    }

    [Fact]
    public async Task ChatComplete_WithInvalidApiKey_Returns401()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Post, "/chat/ChatResponse")
        {
            Content = JsonContent.Create(new
            {
                chatUserId = Guid.NewGuid(),
                messageRequest = "Hello",
                Context = "",
                sessionId = Guid.NewGuid()
            })
        };
        request.Headers.Add("X-Internal-API-Key", "invalid-key-xyz");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().Be("Invalid Credentials");
    }

    [Fact]
    public async Task ChatComplete_WithEmptyApiKey_Returns401()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Post, "/chat/ChatResponse")
        {
            Content = JsonContent.Create(new
            {
                chatUserId = Guid.NewGuid(),
                messageRequest = "Hello",
                Context = "",
                sessionId = Guid.NewGuid()
            })
        };
        request.Headers.Add("X-Internal-API-Key", "");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ChatComplete_WithValidApiKey_Returns200()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Post, "/chat/ChatResponse")
        {
            Content = JsonContent.Create(new
            {
                chatUserId = Guid.NewGuid(),
                messageRequest = "Hello",
                Context = "",
                sessionId = Guid.NewGuid()
            })
        };
        request.Headers.Add("X-Internal-API-Key", "test-internal-key-123");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static Mock<HttpMessageHandler> CreateMockOpenAIHandler()
    {
        var responseContent = """
        {
            "choices": [{"message": {"content": "Test response"}}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5},
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
}
