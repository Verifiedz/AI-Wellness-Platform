namespace ChatService.Tests.Controllers;

using System.Security.Claims;
using ChatService.DTOs;
using ChatService.entities;
using ChatService.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

/// <summary>
/// Unit tests for ChatController.
/// IChatService and ISessionService are mocked.
/// User identity is injected via a ClaimsPrincipal on the controller context.
/// </summary>
public class ChatControllerTests
{
    private readonly Mock<IChatService> _chatServiceMock;
    private readonly Mock<ISessionService> _sessionServiceMock;
    private readonly ChatController _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public ChatControllerTests()
    {
        _chatServiceMock = new Mock<IChatService>();
        _sessionServiceMock = new Mock<ISessionService>();

        _sut = new ChatController(
            _chatServiceMock.Object,
            _sessionServiceMock.Object,
            NullLogger<ChatController>.Instance);

        // Set up authenticated user context
        SetAuthenticatedUser(_userId);
    }

    private void SetAuthenticatedUser(Guid userId)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private void SetUnauthenticatedUser()
    {
        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
        };
    }

    // ------------------------------------------------------------------ //
    // SendChat — happy path
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendChat_Returns200_WithValidRequest()
    {
        var sessionId = Guid.NewGuid();
        var request = new ChatRequest(_userId, "Hello!", string.Empty, sessionId);
        var response = new ChatResponse(_userId, "Hi!", string.Empty, sessionId);

        _chatServiceMock
            .Setup(s => s.SendChatMessageAsync(It.IsAny<ChatRequest>()))
            .ReturnsAsync(response);

        var result = await _sut.SendChat(request);

        var ok = Assert.IsType<OkObjectResult>(result);
        var chatResponse = Assert.IsType<ChatResponse>(ok.Value);
        Assert.Equal("Hi!", chatResponse.message);
    }

    [Fact]
    public async Task SendChat_Returns400_WhenRequestIsNull()
    {
        var result = await _sut.SendChat(null!);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task SendChat_Returns401_WhenUserIdentityIsMissing()
    {
        SetUnauthenticatedUser();
        var request = new ChatRequest(Guid.NewGuid(), "Hello", string.Empty, null);

        var result = await _sut.SendChat(request);

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task SendChat_Returns400_WhenChatServiceThrowsArgumentException()
    {
        var request = new ChatRequest(_userId, string.Empty, string.Empty, null);

        _chatServiceMock
            .Setup(s => s.SendChatMessageAsync(It.IsAny<ChatRequest>()))
            .ThrowsAsync(new ArgumentException("Message cannot be empty"));

        var result = await _sut.SendChat(request);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ------------------------------------------------------------------ //
    // GetSessions
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetSessions_Returns200_WithListOfSessions()
    {
        var sessions = new List<ChatSession>
        {
            new() { sessionID = Guid.NewGuid(), UserId = _userId },
            new() { sessionID = Guid.NewGuid(), UserId = _userId }
        };

        _sessionServiceMock
            .Setup(s => s.GetSessionsByUserAsync(_userId))
            .ReturnsAsync(sessions);

        var result = await _sut.GetSessions();

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IReadOnlyList<ChatSession>>(ok.Value);
        Assert.Equal(2, list.Count);
    }

    [Fact]
    public async Task GetSessions_Returns401_WhenUserIdentityIsMissing()
    {
        SetUnauthenticatedUser();

        var result = await _sut.GetSessions();

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    // ------------------------------------------------------------------ //
    // GetSessionChats
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetSessionChats_Returns200_WithChatList()
    {
        var sessionId = Guid.NewGuid();
        var chats = new List<Chat>
        {
            new() { chatReferenceId = Guid.NewGuid(), message = "Hello", status = enums.Status.Active }
        };

        _chatServiceMock
            .Setup(s => s.GetChatsbySessionAsync(sessionId, _userId))
            .ReturnsAsync(chats);

        var result = await _sut.GetSessionChats(sessionId);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task GetSessionChats_Returns401_WhenUserIdentityIsMissing()
    {
        SetUnauthenticatedUser();

        var result = await _sut.GetSessionChats(Guid.NewGuid());

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task GetSessionChats_Returns404_WhenSessionNotFound()
    {
        var sessionId = Guid.NewGuid();

        _chatServiceMock
            .Setup(s => s.GetChatsbySessionAsync(sessionId, _userId))
            .ThrowsAsync(new KeyNotFoundException("Session not found"));

        var result = await _sut.GetSessionChats(sessionId);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ------------------------------------------------------------------ //
    // BookmarkSession
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task BookmarkSession_Returns204_WhenSuccessful()
    {
        var sessionId = Guid.NewGuid();
        var bookmarkRequest = new BookmarkRequest(isBookmarked: true);

        _sessionServiceMock
            .Setup(s => s.BookmarkSessionAsync(sessionId, _userId, true))
            .Returns(Task.CompletedTask);

        var result = await _sut.BookmarkSession(sessionId, bookmarkRequest);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task BookmarkSession_Returns404_WhenSessionNotFound()
    {
        var sessionId = Guid.NewGuid();
        var bookmarkRequest = new BookmarkRequest(isBookmarked: true);

        _sessionServiceMock
            .Setup(s => s.BookmarkSessionAsync(sessionId, _userId, true))
            .ThrowsAsync(new KeyNotFoundException("Session not found"));

        var result = await _sut.BookmarkSession(sessionId, bookmarkRequest);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ------------------------------------------------------------------ //
    // DeleteSession
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task DeleteSession_Returns204_WhenSuccessful()
    {
        var sessionId = Guid.NewGuid();

        _sessionServiceMock
            .Setup(s => s.DeleteSessionAsync(sessionId, _userId))
            .Returns(Task.CompletedTask);

        var result = await _sut.DeleteSession(sessionId);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteSession_Returns401_WhenUserIdentityIsMissing()
    {
        SetUnauthenticatedUser();

        var result = await _sut.DeleteSession(Guid.NewGuid());

        Assert.IsType<UnauthorizedObjectResult>(result);
    }
}
