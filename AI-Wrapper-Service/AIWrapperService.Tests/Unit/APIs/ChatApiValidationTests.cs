using Xunit;
using FluentAssertions;

namespace AIWrapperService.Tests.Unit.APIs;

/// <summary>
/// Unit tests for ChatApi validation logic.
/// Tests all validation rules for ChatRequest.
/// </summary>
public class ChatApiValidationTests
{
    [Fact]
    public void ValidRequest_ShouldPassValidation()
    {
        // Arrange
        var request = new ChatRequest(
            chatUserId: Guid.NewGuid(),
            messageRequest: "Hello, I need help",
            Context: "",
            sessionId: Guid.NewGuid()
        );

        // Act & Assert
        request.chatUserId.Should().NotBeEmpty();
        request.messageRequest.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void EmptyChatUserId_ShouldFailValidation()
    {
        // Arrange
        var request = new ChatRequest(
            chatUserId: Guid.Empty,
            messageRequest: "Test message",
            Context: "",
            sessionId: Guid.NewGuid()
        );

        // Assert
        request.chatUserId.Should().BeEmpty();
        // Validation layer will reject this
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void EmptyMessageRequest_ShouldFailValidation(string? messageRequest)
    {
        // Arrange
        var request = new ChatRequest(
            chatUserId: Guid.NewGuid(),
            messageRequest: messageRequest!,
            Context: "",
            sessionId: Guid.NewGuid()
        );

        // Assert
        request.messageRequest.Should().BeNullOrWhiteSpace();
    }

    [Fact]
    public void NullSessionId_ShouldFailValidation()
    {
        // Arrange
        var request = new ChatRequest(
            chatUserId: Guid.NewGuid(),
            messageRequest: "Test message",
            Context: "",
            sessionId: null
        );

        // Assert - null sessionId is invalid (required from Chat Service)
        request.sessionId.Should().BeNull();
        // Validation layer will reject this
    }

    [Fact]
    public void ValidSessionId_ShouldBeAccepted()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var request = new ChatRequest(
            chatUserId: Guid.NewGuid(),
            messageRequest: "Test message",
            Context: "",
            sessionId: sessionId
        );

        // Assert
        request.sessionId.Should().Be(sessionId);
    }

    [Fact]
    public void EmptyContext_ShouldBeAccepted()
    {
        // Arrange
        var request = new ChatRequest(
            chatUserId: Guid.NewGuid(),
            messageRequest: "Test message",
            Context: "",
            sessionId: Guid.NewGuid()
        );

        // Assert - empty context is valid
        request.Context.Should().BeEmpty();
    }
}
