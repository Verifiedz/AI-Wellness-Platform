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
            sessionId = "test-session-123",
            messages = new[] { new { role = "user", content = "I feel stressed today" } },
            temperature = 0.7
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        result.Should().NotBeNull();
        result!.SessionId.Should().Be("test-session-123");
        result.Reply.Should().NotBeNullOrEmpty();
        result.Model.Should().Be("gpt-4o-mini");
        result.PromptTokens.Should().Be(150);
        result.CompletionTokens.Should().Be(95);
    }

    [Fact]
    public async Task ChatComplete_WithCustomModel_UsesSpecifiedModel()
    {
        // Arrange
        var mockHandler = CreateMockOpenAIHandler(model: "gpt-4");
        using var factory = new CustomWebApplicationFactory<Program>
        {
            MockHttpHandler = mockHandler.Object
        };
        using var client = factory.CreateClient();

        var request = CreateAuthenticatedRequest(new
        {
            sessionId = "test-session",
            messages = new[] { new { role = "user", content = "Hello" } },
            model = "gpt-4",
            temperature = 0.5
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        result!.Model.Should().Be("gpt-4");
    }

    [Fact]
    public async Task ChatComplete_WithMultipleMessages_ProcessesConversation()
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
            sessionId = "conversation-session",
            messages = new[]
            {
                new { role = "user", content = "I've been feeling anxious lately" },
                new { role = "assistant", content = "I hear you. Can you tell me more about what's been causing your anxiety?" },
                new { role = "user", content = "Work has been really stressful" }
            },
            temperature = 0.7
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        result.Should().NotBeNull();
        result!.Reply.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task ChatComplete_WithSystemMessage_DoesNotInjectDefaultPrompt()
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
            sessionId = "custom-system-session",
            messages = new[]
            {
                new { role = "system", content = "You are a helpful assistant." },
                new { role = "user", content = "Hello" }
            },
            temperature = 0.7
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChatComplete_WithMinTemperature_Succeeds()
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
            sessionId = "low-temp-session",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = 0.0
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChatComplete_WithMaxTemperature_Succeeds()
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
            sessionId = "high-temp-session",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = 1.0
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChatComplete_ResponseIncludesCorrectSessionId()
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
            sessionId = "unique-session-id-12345",
            messages = new[] { new { role = "user", content = "Hello" } },
            temperature = 0.7
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        result!.SessionId.Should().Be("unique-session-id-12345");
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

    private static Mock<HttpMessageHandler> CreateMockOpenAIHandler(string model = "gpt-4o-mini")
    {
        var responseContent = $$"""
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
            "model": "{{model}}"
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
