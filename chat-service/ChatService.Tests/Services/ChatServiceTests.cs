namespace ChatService.Tests.Services;

using ChatService.DTOs;
using ChatService.entities;
using ChatService.Interfaces;
using ChatService.Services;
using Moq;

/// <summary>
/// Unit tests for chatService (note: lowercase 'c' is the actual class name).
/// All dependencies are mocked — no live database or AI wrapper calls are made.
/// </summary>
public class ChatServiceTests
{
    private readonly Mock<IChatWrapperClientInterface> _wrapperMock;
    private readonly Mock<ISessionService> _sessionMock;
    private readonly Mock<IChatDatabaseProvider> _dbMock;
    private readonly chatService _sut;

    public ChatServiceTests()
    {
        _wrapperMock = new Mock<IChatWrapperClientInterface>();
        _sessionMock = new Mock<ISessionService>();
        _dbMock = new Mock<IChatDatabaseProvider>();

        _sut = new chatService(
            _wrapperMock.Object,
            _sessionMock.Object,
            _dbMock.Object);
    }

    // ------------------------------------------------------------------ //
    // SendChatMessageAsync — happy path
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendChatMessageAsync_ReturnsResponse_WhenRequestIsValid()
    {
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var session = new ChatSession { sessionID = sessionId, UserId = userId };
        var request = new ChatRequest(userId, "Hello there", string.Empty, sessionId);

        _sessionMock
            .Setup(s => s.GetOrCreateSessionAsync(userId, sessionId))
            .ReturnsAsync(session);

        _dbMock
            .Setup(d => d.getChatsBySessionAsync(sessionId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Chat>());

        _dbMock
            .Setup(d => d.createChatAsync(It.IsAny<Chat>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var expectedResponse = new ChatResponse(userId, "Hi there!", string.Empty, sessionId);
        _wrapperMock
            .Setup(w => w.getChatResponseAsync(It.IsAny<ChatRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        var response = await _sut.SendChatMessageAsync(request);

        Assert.Equal("Hi there!", response.message);
        Assert.Equal(sessionId, response.sessionId);
        Assert.Equal(userId, response.chatUserId);
    }

    [Fact]
    public async Task SendChatMessageAsync_CallsCreateChatAsync_Twice_ForRequestAndResponse()
    {
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var session = new ChatSession { sessionID = sessionId, UserId = userId };
        var request = new ChatRequest(userId, "Test message", string.Empty, sessionId);

        _sessionMock
            .Setup(s => s.GetOrCreateSessionAsync(userId, sessionId))
            .ReturnsAsync(session);

        _dbMock
            .Setup(d => d.getChatsBySessionAsync(sessionId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Chat>());

        _dbMock
            .Setup(d => d.createChatAsync(It.IsAny<Chat>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _wrapperMock
            .Setup(w => w.getChatResponseAsync(It.IsAny<ChatRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChatResponse(userId, "AI response", string.Empty, sessionId));

        await _sut.SendChatMessageAsync(request);

        // createChatAsync should be called once for the user message and once for the AI response
        _dbMock.Verify(d => d.createChatAsync(It.IsAny<Chat>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task SendChatMessageAsync_ThrowsArgumentException_WhenMessageIsEmpty()
    {
        var request = new ChatRequest(Guid.NewGuid(), string.Empty, string.Empty, null);

        await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.SendChatMessageAsync(request));
    }

    [Fact]
    public async Task SendChatMessageAsync_ThrowsNullReferenceException_WhenRequestIsNull()
    {
        await Assert.ThrowsAsync<NullReferenceException>(
            () => _sut.SendChatMessageAsync(null!));
    }

    // ------------------------------------------------------------------ //
    // SendChatMessageAsync — new session path (no sessionId)
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendChatMessageAsync_UpdatesSessionName_WhenNewSession()
    {
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var session = new ChatSession { sessionID = sessionId, UserId = userId };
        // null sessionId => treated as new session
        var request = new ChatRequest(userId, "Hello world", string.Empty, null);

        _sessionMock
            .Setup(s => s.GetOrCreateSessionAsync(userId, null))
            .ReturnsAsync(session);

        _sessionMock
            .Setup(s => s.UpdateSessionNameAsync(sessionId, It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        _dbMock
            .Setup(d => d.getChatsBySessionAsync(sessionId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Chat>());

        _dbMock
            .Setup(d => d.createChatAsync(It.IsAny<Chat>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _wrapperMock
            .Setup(w => w.getChatResponseAsync(It.IsAny<ChatRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChatResponse(userId, "Reply", string.Empty, sessionId));

        await _sut.SendChatMessageAsync(request);

        _sessionMock.Verify(
            s => s.UpdateSessionNameAsync(sessionId, It.IsAny<string>()),
            Times.Once);
    }

    // ------------------------------------------------------------------ //
    // GetChatsbySessionAsync
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetChatsbySessionAsync_ReturnsChats_FromDatabaseProvider()
    {
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var session = new ChatSession { sessionID = sessionId, UserId = userId };
        var expectedChats = new List<Chat>
        {
            new() { chatReferenceId = Guid.NewGuid(), message = "msg1", status = enums.Status.Active },
            new() { chatReferenceId = Guid.NewGuid(), message = "msg2", status = enums.Status.Active }
        };

        _sessionMock
            .Setup(s => s.GetOrCreateSessionAsync(userId, sessionId))
            .ReturnsAsync(session);

        _dbMock
            .Setup(d => d.getChatsBySessionAsync(sessionId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedChats);

        var result = await _sut.GetChatsbySessionAsync(sessionId, userId);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetChatsbySessionAsync_ThrowsArgumentException_WhenSessionIdIsEmpty()
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.GetChatsbySessionAsync(Guid.Empty, Guid.NewGuid()));
    }

    // ------------------------------------------------------------------ //
    // Pagination — limit and offset forwarding
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetChatsbySessionAsync_PassesLimitOffset_ToDatabaseProvider()
    {
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var session = new ChatSession { sessionID = sessionId, UserId = userId };

        _sessionMock
            .Setup(s => s.GetOrCreateSessionAsync(userId, sessionId))
            .ReturnsAsync(session);

        _dbMock
            .Setup(d => d.getChatsBySessionAsync(sessionId, 20, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Chat>());

        await _sut.GetChatsbySessionAsync(sessionId, userId, 20, 10);

        _dbMock.Verify(
            d => d.getChatsBySessionAsync(sessionId, 20, 10, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ------------------------------------------------------------------ //
    // CancellationToken propagation
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendChatMessageAsync_Cancellation_PropagatesTokenToWrapper()
    {
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var session = new ChatSession { sessionID = sessionId, UserId = userId };
        var request = new ChatRequest(userId, "Hello", string.Empty, sessionId);

        _sessionMock
            .Setup(s => s.GetOrCreateSessionAsync(userId, sessionId))
            .ReturnsAsync(session);

        _dbMock
            .Setup(d => d.getChatsBySessionAsync(sessionId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Chat>());

        _dbMock
            .Setup(d => d.createChatAsync(It.IsAny<Chat>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        _wrapperMock
            .Setup(w => w.getChatResponseAsync(It.IsAny<ChatRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => _sut.SendChatMessageAsync(request, cts.Token));
    }
}
