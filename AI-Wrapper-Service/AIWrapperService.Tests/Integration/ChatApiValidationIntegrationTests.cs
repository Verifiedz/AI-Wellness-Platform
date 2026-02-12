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
    public async Task ChatComplete_WithValidRequest_Returns200()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "Hello",
            Context = "",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChatComplete_WithEmptyChatUserId_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.Empty,
            messageRequest = "Hello",
            Context = "",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().Be("Validation Failed");
        problemDetails.Detail.Should().Contain("chatUserId");
    }

    [Fact]
    public async Task ChatComplete_WithEmptyMessageRequest_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "",
            Context = "",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Detail.Should().Contain("messageRequest");
    }

    [Fact]
    public async Task ChatComplete_WithWhitespaceMessageRequest_Returns400()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "   ",
            Context = "",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChatComplete_WithNullSessionId_Returns400()
    {
        // Arrange - sessionId is required from Chat Service
        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "Hello",
            Context = ""
            // sessionId omitted
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Detail.Should().Contain("sessionId");
    }

    [Fact]
    public async Task ChatComplete_WithEmptyContext_Returns200()
    {
        // Arrange - empty context is valid
        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "Hello",
            Context = "",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChatComplete_WithMultipleValidationErrors_ReturnsAllErrors()
    {
        // Arrange
        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.Empty,
            messageRequest = "",
            Context = "",
            sessionId = Guid.Empty
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
        var request = new HttpRequestMessage(HttpMethod.Post, "/chat/ChatResponse")
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
    public async Task ChatComplete_WithMissingContentType_Returns415Or400()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Post, "/chat/ChatResponse")
        {
            Content = new StringContent("{\"chatUserId\": 1}")
        };
        request.Headers.Add("X-Internal-API-Key", ValidApiKey);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        // Should be either 400 or 415 depending on framework handling
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.UnsupportedMediaType);
    }

    private HttpRequestMessage CreateAuthenticatedRequest(object body)
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
