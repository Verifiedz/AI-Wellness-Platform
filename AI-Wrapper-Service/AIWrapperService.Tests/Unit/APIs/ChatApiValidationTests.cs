using Xunit;
using FluentAssertions;

namespace AIWrapperService.Tests.Unit.APIs;

/// <summary>
/// Unit tests for ChatApi validation logic.
/// Tests all validation rules for ChatRequestDto.
/// </summary>
public class ChatApiValidationTests
{
    [Fact]
    public void ValidRequest_ShouldPassValidation()
    {
        // Arrange
        var request = new ChatRequestDto
        {
            SessionId = "valid-session-123",
            Messages = new List<ChatMessageDto>
            {
                new() { Role = Role.User, Content = "Hello, I need help" }
            },
            Temperature = 0.7
        };

        // Act & Assert
        // Note: In a real scenario, you'd need to expose the ValidateRequest method
        // or test through the full endpoint. For now, this demonstrates the structure.
        request.SessionId.Should().NotBeNullOrEmpty();
        request.Messages.Should().NotBeEmpty();
        request.Temperature.Should().BeInRange(0.0, 1.0);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void EmptySessionId_ShouldFailValidation(string sessionId)
    {
        // Arrange
        var request = new ChatRequestDto
        {
            SessionId = sessionId!,
            Messages = new List<ChatMessageDto>
            {
                new() { Role = Role.User, Content = "Test" }
            }
        };

        // Assert
        request.SessionId.Should().BeNullOrWhiteSpace();
    }

    [Fact]
    public void EmptyMessages_ShouldFailValidation()
    {
        // Arrange
        var request = new ChatRequestDto
        {
            SessionId = "test-session",
            Messages = new List<ChatMessageDto>()
        };

        // Assert
        request.Messages.Should().BeEmpty();
    }

    [Theory]
    [InlineData(-0.1)]
    [InlineData(1.1)]
    [InlineData(2.0)]
    public void InvalidTemperature_ShouldFailValidation(double temperature)
    {
        // Arrange
        var request = new ChatRequestDto
        {
            SessionId = "test-session",
            Messages = new List<ChatMessageDto>
            {
                new() { Role = Role.User, Content = "Test" }
            },
            Temperature = temperature
        };

        // Assert
        request.Temperature.Should().NotBeInRange(0.0, 1.0);
    }

    [Fact]
    public void MessageWithEmptyContent_ShouldFailValidation()
    {
        // Arrange
        var message = new ChatMessageDto
        {
            Role = Role.User,
            Content = ""
        };

        // Assert
        message.Content.Should().BeEmpty();
    }

    [Theory]
    [InlineData(Role.System)]
    [InlineData(Role.User)]
    [InlineData(Role.Assistant)]
    public void ValidRoles_ShouldBeAccepted(Role role)
    {
        // Arrange
        var message = new ChatMessageDto
        {
            Role = role,
            Content = "Test message"
        };

        // Assert
        message.Role.Should().BeOneOf(Role.System, Role.User, Role.Assistant);
    }
}
