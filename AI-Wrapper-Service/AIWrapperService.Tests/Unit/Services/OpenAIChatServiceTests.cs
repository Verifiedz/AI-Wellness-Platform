using AIWrapperService.Services;
using AIWrapperService.Tests.Fixtures;
using Xunit;
using FluentAssertions;
using Moq;

namespace AIWrapperService.Tests.Unit.Services;

/// <summary>
/// Unit tests for OpenAIChatService.
/// Tests the core business logic including prompting, OpenAI integration, and error handling.
/// </summary>
public class OpenAIChatServiceTests
{
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
        result.sessionId.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetChatResponseAsync_WithValidSessionId_PreservesSessionId()
    {
        // Arrange
        var mockHandler = TestHelpers.CreateMockHttpHandler();
        var httpClient = new HttpClient(mockHandler.Object);
        var config = TestHelpers.CreateTestConfig();
        var logger = new Mock<ILogger<OpenAIChatService>>().Object;
        var service = new OpenAIChatService(httpClient, config, logger);

        var sessionId = Guid.NewGuid();
        var request = new ChatRequest(
            chatUserId: Guid.NewGuid(),
            messageRequest: "Hello",
            Context: "",
            sessionId: sessionId
        );

        // Act
        var result = await service.GetChatResponseAsync(request);

        // Assert
        result.sessionId.Should().Be(sessionId);
    }

    [Fact]
    public async Task GetChatResponseAsync_WhenOpenAIReturnsError_ThrowsHttpRequestException()
    {
        // Arrange
        var mockHandler = TestHelpers.CreateMockHttpHandlerWithError(
            HttpStatusCode.Unauthorized,
            @"{""error"": {""message"": ""Invalid API key""}}");

        var httpClient = new HttpClient(mockHandler.Object);
        var config = TestHelpers.CreateTestConfig();
        var logger = new Mock<ILogger<OpenAIChatService>>().Object;
        var service = new OpenAIChatService(httpClient, config, logger);

        var request = TestHelpers.CreateTestChatRequest();

        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(() => service.GetChatResponseAsync(request));
    }

    [Fact]
    public void Constructor_SetsTimeout_To30Seconds()
    {
        // Arrange
        var httpClient = new HttpClient();
        var config = TestHelpers.CreateTestConfig();
        var logger = new Mock<ILogger<OpenAIChatService>>().Object;

        // Act
        var service = new OpenAIChatService(httpClient, config, logger);

        // Assert
        httpClient.Timeout.Should().Be(TimeSpan.FromSeconds(30));
    }

    [Fact]
    public void Constructor_WhenApiKeyMissing_ThrowsInvalidOperationException()
    {
        // Arrange
        var httpClient = new HttpClient();
        var config = TestHelpers.CreateTestConfig(new Dictionary<string, string?>
        {
            ["OpenAI:ApiKey"] = null // Missing API key
        });
        var logger = new Mock<ILogger<OpenAIChatService>>().Object;

        // Act & Assert - Exception thrown in constructor (fail-fast)
        var exception = Assert.Throws<InvalidOperationException>(() =>
            new OpenAIChatService(httpClient, config, logger));

        exception.Message.Should().Contain("OpenAI:ApiKey is not configured");
    }
}
