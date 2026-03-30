namespace ChatService.Tests.Services;

using ChatService.entities;
using ChatService.Interfaces;
using ChatService.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

/// <summary>
/// Unit tests for SessionService.
/// All database and cache access is mocked via ISessionDatabaseProvider and ICacheServiceProvider.
/// No connection strings or live infrastructure is required.
/// </summary>
public class SessionServiceTests
{
    private readonly Mock<ISessionDatabaseProvider> _dbMock;
    private readonly Mock<ICacheServiceProvider> _cacheMock;
    private readonly SessionService _sut;

    public SessionServiceTests()
    {
        _dbMock = new Mock<ISessionDatabaseProvider>();
        _cacheMock = new Mock<ICacheServiceProvider>();

        // Default: cache always returns null (cache miss)
        _cacheMock
            .Setup(c => c.GetAsync<ChatSession>(It.IsAny<string>()))
            .ReturnsAsync((ChatSession?)null);

        _sut = new SessionService(
            _dbMock.Object,
            _cacheMock.Object,
            NullLogger<SessionService>.Instance);
    }

    // ------------------------------------------------------------------ //
    // CreateSessionAsync — happy path
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task CreateSessionAsync_ReturnsNewSession_WithGeneratedId()
    {
        var userId = Guid.NewGuid();

        _dbMock
            .Setup(d => d.createSessionAsync(It.IsAny<ChatSession>()))
            .Returns(Task.CompletedTask);

        var session = await _sut.CreateSessionAsync(userId);

        Assert.NotEqual(Guid.Empty, session.sessionID);
        Assert.Equal(userId, session.UserId);
        Assert.False(session.isBookmarked);
    }

    [Fact]
    public async Task CreateSessionAsync_CallsDatabaseProvider_WithNewSession()
    {
        var userId = Guid.NewGuid();
        ChatSession? captured = null;

        _dbMock
            .Setup(d => d.createSessionAsync(It.IsAny<ChatSession>()))
            .Callback<ChatSession>(s => captured = s)
            .Returns(Task.CompletedTask);

        await _sut.CreateSessionAsync(userId);

        Assert.NotNull(captured);
        Assert.Equal(userId, captured!.UserId);
    }

    [Fact]
    public async Task CreateSessionAsync_ThrowsArgumentException_WhenUserIdIsEmpty()
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateSessionAsync(Guid.Empty));
    }

    // ------------------------------------------------------------------ //
    // GetSessionsByUserAsync
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetSessionsByUserAsync_ReturnsSessions_FromDatabaseProvider()
    {
        var userId = Guid.NewGuid();
        var expected = new List<ChatSession>
        {
            new() { sessionID = Guid.NewGuid(), UserId = userId },
            new() { sessionID = Guid.NewGuid(), UserId = userId }
        };

        _dbMock
            .Setup(d => d.getSessionsbyUserAsync(userId))
            .ReturnsAsync(expected);

        var result = await _sut.GetSessionsByUserAsync(userId);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetSessionsByUserAsync_ThrowsArgumentException_WhenUserIdIsEmpty()
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.GetSessionsByUserAsync(Guid.Empty));
    }

    // ------------------------------------------------------------------ //
    // UpdateSessionNameAsync
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task UpdateSessionNameAsync_CallsDatabaseProvider_WithCorrectName()
    {
        var sessionId = Guid.NewGuid();
        const string newName = "My New Session Name";

        _dbMock
            .Setup(d => d.updateSessionNameAsync(sessionId, newName))
            .Returns(Task.CompletedTask);

        await _sut.UpdateSessionNameAsync(sessionId, newName);

        _dbMock.Verify(d => d.updateSessionNameAsync(sessionId, newName), Times.Once);
    }

    [Fact]
    public async Task UpdateSessionNameAsync_UpdatesCachedSession_WhenCacheHit()
    {
        var sessionId = Guid.NewGuid();
        var cachedSession = new ChatSession
        {
            sessionID = sessionId,
            UserId = Guid.NewGuid(),
            SessionName = "Old Name"
        };

        _cacheMock
            .Setup(c => c.GetAsync<ChatSession>($"session:{sessionId}"))
            .ReturnsAsync(cachedSession);

        _dbMock
            .Setup(d => d.updateSessionNameAsync(sessionId, "New Name"))
            .Returns(Task.CompletedTask);

        await _sut.UpdateSessionNameAsync(sessionId, "New Name");

        // Verify the cache was updated with the new name
        _cacheMock.Verify(
            c => c.SetAsync($"session:{sessionId}", It.Is<ChatSession>(s => s.SessionName == "New Name"), null),
            Times.Once);
    }

    // ------------------------------------------------------------------ //
    // BookmarkSessionAsync
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task BookmarkSessionAsync_CallsSetBookmark_WhenSessionBelongsToUser()
    {
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var session = new ChatSession { sessionID = sessionId, UserId = userId };

        _dbMock.Setup(d => d.getSessionAsync(sessionId)).ReturnsAsync(session);
        _dbMock.Setup(d => d.setBookmarkAsync(sessionId, true)).Returns(Task.CompletedTask);

        await _sut.BookmarkSessionAsync(sessionId, userId, isBookmarked: true);

        _dbMock.Verify(d => d.setBookmarkAsync(sessionId, true), Times.Once);
    }

    [Fact]
    public async Task BookmarkSessionAsync_ThrowsKeyNotFoundException_WhenSessionNotFound()
    {
        var sessionId = Guid.NewGuid();

        _dbMock.Setup(d => d.getSessionAsync(sessionId)).ReturnsAsync((ChatSession)null!);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _sut.BookmarkSessionAsync(sessionId, Guid.NewGuid(), true));
    }

    [Fact]
    public async Task BookmarkSessionAsync_ThrowsKeyNotFoundException_WhenSessionBelongsToDifferentUser()
    {
        var sessionId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var session = new ChatSession { sessionID = sessionId, UserId = ownerUserId };

        _dbMock.Setup(d => d.getSessionAsync(sessionId)).ReturnsAsync(session);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _sut.BookmarkSessionAsync(sessionId, otherUserId, true));
    }

    // ------------------------------------------------------------------ //
    // DeleteSessionAsync
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task DeleteSessionAsync_CallsDeleteAndRemovesFromCache_WhenSessionBelongsToUser()
    {
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var session = new ChatSession { sessionID = sessionId, UserId = userId };

        _dbMock.Setup(d => d.getSessionAsync(sessionId)).ReturnsAsync(session);
        _dbMock.Setup(d => d.deleteSessionAsync(sessionId)).Returns(Task.CompletedTask);

        await _sut.DeleteSessionAsync(sessionId, userId);

        _dbMock.Verify(d => d.deleteSessionAsync(sessionId), Times.Once);
        _cacheMock.Verify(c => c.RemoveAsync($"session:{sessionId}"), Times.Once);
    }

    // ------------------------------------------------------------------ //
    // GetOrCreateSessionAsync — creates new when specificSessionId is null
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetOrCreateSessionAsync_CreatesNewSession_WhenNoSpecificSessionIdProvided()
    {
        var userId = Guid.NewGuid();

        _dbMock
            .Setup(d => d.createSessionAsync(It.IsAny<ChatSession>()))
            .Returns(Task.CompletedTask);

        var session = await _sut.GetOrCreateSessionAsync(userId, specificSessionId: null);

        Assert.NotEqual(Guid.Empty, session.sessionID);
        Assert.Equal(userId, session.UserId);
    }

    [Fact]
    public async Task GetOrCreateSessionAsync_ReturnsCachedSession_WhenCacheHit()
    {
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var cachedSession = new ChatSession { sessionID = sessionId, UserId = userId };

        _cacheMock
            .Setup(c => c.GetAsync<ChatSession>($"session:{sessionId}"))
            .ReturnsAsync(cachedSession);

        var result = await _sut.GetOrCreateSessionAsync(userId, sessionId);

        Assert.Equal(sessionId, result.sessionID);
        // Database should NOT be called when cache hits
        _dbMock.Verify(d => d.getSessionAsync(It.IsAny<Guid>()), Times.Never);
    }
}
