using Microsoft.AspNetCore.Mvc.Testing;
using Moq;
using Moq.Protected;
using Xunit;
using FluentAssertions;
using AIWrapperService.Tests.Fixtures;

namespace AIWrapperService.Tests.Integration;

/// <summary>
/// Integration tests for successful chat completion scenarios.
/// Tests the full request/response flow with mocked OpenAI responses.
/// </summary>
public class ChatApiCompletionTests
{
    private const string ValidApiKey = "test-internal-key-123";

    [Fact]
    public async Task ChatComplete_WithValidRequest_Returns200WithResponse()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "I feel stressed today",
            Context = "",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ChatResponse>();
        result.Should().NotBeNull();
        result!.chatUserId.Should().NotBeEmpty();
        result.message.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task ChatComplete_WithNullSessionId_Returns400()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "Hello",
            Context = ""
            // sessionId omitted (null) - now required
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChatComplete_PreservesSessionId()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "Hello",
            Context = "",
            sessionId = sessionId
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ChatResponse>();
        result!.sessionId.Should().Be(sessionId);
    }

    [Fact]
    public async Task ChatComplete_PreservesChatUserId()
    {
        // Arrange
        var chatUserId = Guid.NewGuid();
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = chatUserId,
            messageRequest = "Hello",
            Context = "",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ChatResponse>();
        result!.chatUserId.Should().Be(chatUserId);
    }

    [Fact]
    public async Task ChatComplete_PreservesContext()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "Hello",
            Context = "Previous conversation context here",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ChatResponse>();
        result!.Context.Should().Be("Previous conversation context here");
    }

    [Fact]
    public async Task ChatComplete_WithInvalidChatUserId_Returns400()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = 0, // Invalid
            messageRequest = "Hello",
            Context = "",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChatComplete_WithEmptyMessageRequest_Returns400()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler();
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = CreateAuthenticatedRequest(new
        {
            chatUserId = Guid.NewGuid(),
            messageRequest = "", // Invalid
            Context = "",
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
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
        var responseContent = """
        {
            "choices": [{
                "message": {
                    "content": "I understand you're feeling stressed. That's a completely valid emotion. Can you tell me more about what's been contributing to your stress lately?"
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
}
