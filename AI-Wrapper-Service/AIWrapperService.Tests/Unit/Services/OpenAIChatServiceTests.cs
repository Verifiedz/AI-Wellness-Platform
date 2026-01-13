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
    public async Task CompleteAsync_WithValidRequest_ReturnsSuccessfulResponse()
    {
        // Arrange
        var mockHandler = TestHelpers.CreateMockHttpHandler();
        var httpClient = new HttpClient(mockHandler.Object);
        var config = TestHelpers.CreateTestConfig();
        var logger = new Mock<ILogger<OpenAIChatService>>().Object;
        var service = new OpenAIChatService(httpClient, config, logger);

        var request = TestHelpers.CreateTestChatRequest();

        // Act
        var result = await service.CompleteAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.SessionId.Should().Be("test-session-123");
        result.Model.Should().Be("gpt-4o-mini");
        result.Reply.Should().NotBeEmpty();
        result.PromptTokens.Should().Be(150);
        result.CompletionTokens.Should().Be(95);
    }

    [Fact]
    public async Task CompleteAsync_WithCustomModel_UsesSpecifiedModel()
    {
        // Arrange
        var mockHandler = TestHelpers.CreateMockHttpHandler();
        var httpClient = new HttpClient(mockHandler.Object);
        var config = TestHelpers.CreateTestConfig();
        var logger = new Mock<ILogger<OpenAIChatService>>().Object;
        var service = new OpenAIChatService(httpClient, config, logger);

        var request = new ChatRequestDto
        {
            SessionId = "test-session",
            Messages = new List<ChatMessageDto>
            {
                new() { Role = Role.User, Content = "Hello" }
            },
            Model = "gpt-4",
            Temperature = 0.5
        };

        // Act
        var result = await service.CompleteAsync(request);

        // Assert
        result.Model.Should().Be("gpt-4"); // Service returns the requested model
    }

    [Fact]
    public async Task CompleteAsync_WhenOpenAIReturnsError_ThrowsHttpRequestException()
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
        await Assert.ThrowsAsync<HttpRequestException>(() => service.CompleteAsync(request));
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
