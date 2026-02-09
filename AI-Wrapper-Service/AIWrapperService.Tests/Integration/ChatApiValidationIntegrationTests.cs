using Microsoft.AspNetCore.Mvc.Testing;
using Moq;
using Moq.Protected;
using Xunit;
using FluentAssertions;
using AIWrapperService.Tests.Fixtures;

namespace AIWrapperService.Tests.Integration;

/// <summary>
/// Integration tests for chat API request validation.
/// Tests that invalid requests return proper 400 responses with detailed error messages.
/// </summary>
public class ChatApiValidationIntegrationTests : IDisposable
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private const string ValidApiKey = "test-internal-key-123";

    public ChatApiValidationIntegrationTests()
    {
        var mockHandler = CreateMockOpenAIHandler();
        _factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Fact]
    public async Task ChatComplete_WithEmptySessionId_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = 0.7
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().Be("Validation Failed");
        problemDetails.Detail.Should().Contain("SessionId");
    }

    [Fact]
    public async Task ChatComplete_WithWhitespaceSessionId_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "   ",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = 0.7
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChatComplete_WithEmptyMessagesList_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "test-session",
            messages = Array.Empty<object>(),
            temperature = 0.7
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Detail.Should().Contain("Messages");
    }

    [Fact]
    public async Task ChatComplete_WithNullMessages_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "test-session",
            messages = (object?)null,
            temperature = 0.7
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChatComplete_WithEmptyMessageContent_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "test-session",
            messages = new[] { new { role = "user", content = "" } },
            temperature = 0.7
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Detail.Should().Contain("Content");
    }

    [Fact]
    public async Task ChatComplete_WithWhitespaceMessageContent_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "test-session",
            messages = new[] { new { role = "user", content = "   " } },
            temperature = 0.7
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChatComplete_WithTemperatureBelowZero_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "test-session",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = -0.1
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Detail.Should().Contain("Temperature");
    }

    [Fact]
    public async Task ChatComplete_WithTemperatureAboveOne_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "test-session",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = 1.5
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Detail.Should().Contain("Temperature");
    }

    [Fact]
    public async Task ChatComplete_WithMultipleValidationErrors_ReturnsAllErrors()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "",
            messages = new[] { new { role = "user", content = "" } },
            temperature = 2.0
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Extensions.Should().ContainKey("errors");
    }

    [Fact]
    public async Task ChatComplete_WithInvalidJson_Returns400()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Post, "/v1/chat/complete")
        {
            Content = new StringContent("{ invalid json }", System.Text.Encoding.UTF8, "application/json")
        };
        request.Headers.Add("X-Internal-API-Key", ValidApiKey);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChatComplete_WithMissingContentType_Returns415()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Post, "/v1/chat/complete")
        {
            Content = new StringContent("{\"sessionId\": \"test\"}")
        };
        request.Headers.Add("X-Internal-API-Key", ValidApiKey);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        // Should be either 400 or 415 depending on framework handling
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.UnsupportedMediaType);
    }

    [Theory]
    [InlineData("user")]
    [InlineData("assistant")]
    [InlineData("system")]
    public async Task ChatComplete_WithValidRole_Succeeds(string role)
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "test-session",
            messages = new[] { new { role = role, content = "Hello" } },
            temperature = 0.7
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private HttpRequestMessage CreateAuthenticatedRequest(object body)
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
