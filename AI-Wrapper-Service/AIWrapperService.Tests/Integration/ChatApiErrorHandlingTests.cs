using Microsoft.AspNetCore.Mvc.Testing;
using Moq;
using Moq.Protected;
using Xunit;
using FluentAssertions;
using AIWrapperService.Tests.Fixtures;

namespace AIWrapperService.Tests.Integration;

/// <summary>
/// Integration tests for error handling scenarios.
/// Tests upstream failures, timeouts, and configuration errors.
/// </summary>
public class ChatApiErrorHandlingTests
{
    private const string ValidApiKey = "test-internal-key-123";

    [Fact]
    public async Task ChatComplete_WhenOpenAIReturns500_Returns502()
    {
        // Arrange
        var mockHandler = CreateMockErrorHandler(HttpStatusCode.InternalServerError);
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
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().Be("Upstream Service Error");
        problemDetails.Extensions.Should().ContainKey("traceId");
    }

    [Fact]
    public async Task ChatComplete_WhenOpenAIReturns429_Returns502()
    {
        // Arrange
        var mockHandler = CreateMockErrorHandler(HttpStatusCode.TooManyRequests);
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
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
    }

    [Fact]
    public async Task ChatComplete_WhenOpenAIReturns401_Returns502()
    {
        // Arrange
        var mockHandler = CreateMockErrorHandler(HttpStatusCode.Unauthorized);
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
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
    }

    [Fact]
    public async Task ChatComplete_WhenOpenAIReturns503_Returns502()
    {
        // Arrange
        var mockHandler = CreateMockErrorHandler(HttpStatusCode.ServiceUnavailable);
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
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
    }

    [Fact]
    public async Task ChatComplete_WhenOpenAITimesOut_Returns504()
    {
        // Arrange
        var mockHandler = CreateTimeoutHandler();
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
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.GatewayTimeout);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().Be("Request Timeout");
    }

    [Fact]
    public async Task ChatComplete_WhenConnectionFails_Returns502()
    {
        // Arrange
        var mockHandler = CreateConnectionFailureHandler();
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
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
    }

    [Fact]
    public async Task ChatComplete_WhenOpenAIReturnsInvalidJson_Returns502Or500()
    {
        // Arrange
        var mockHandler = CreateMockHandlerWithInvalidResponse();
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
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        // Should return 500 or 502 depending on where the error is caught
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.InternalServerError,
            HttpStatusCode.BadGateway);
    }

    [Fact]
    public async Task ChatComplete_ErrorResponse_IncludesTraceId()
    {
        // Arrange
        var mockHandler = CreateMockErrorHandler(HttpStatusCode.InternalServerError);
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
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Extensions.Should().ContainKey("traceId");
        problemDetails.Extensions["traceId"].Should().NotBeNull();
    }

    [Fact]
    public async Task ChatComplete_ErrorResponse_IncludesInstancePath()
    {
        // Arrange
        var mockHandler = CreateMockErrorHandler(HttpStatusCode.InternalServerError);
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
            sessionId = Guid.NewGuid()
        });

        // Act
        var response = await client.SendAsync(request);

        // Assert
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Instance.Should().Be("/chat/ChatResponse");
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

    private static Mock<HttpMessageHandler> CreateMockErrorHandler(HttpStatusCode statusCode)
    {
        var errorContent = """
        {
            "error": {
                "message": "Upstream service error",
                "type": "api_error",
                "code": "service_unavailable"
            }
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
                StatusCode = statusCode,
                Content = new StringContent(errorContent)
            });

        return mockHandler;
    }

    private static Mock<HttpMessageHandler> CreateTimeoutHandler()
    {
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new TaskCanceledException("Request timed out"));

        return mockHandler;
    }

    private static Mock<HttpMessageHandler> CreateConnectionFailureHandler()
    {
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("Connection refused"));

        return mockHandler;
    }

    private static Mock<HttpMessageHandler> CreateMockHandlerWithInvalidResponse()
    {
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
                Content = new StringContent("{ invalid json response }")
            });

        return mockHandler;
    }
}
