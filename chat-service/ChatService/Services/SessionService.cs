using ChatService.Entities;
using ChatService.Interfaces;
using Microsoft.Extensions.Logging;

namespace ChatService.Services;

public class SessionService : ISessionService
{
  private readonly ISessionDatabaseProvider _sessionDatabaseProvider;
  private readonly ICacheServiceProvider _cache;
  private readonly ILogger<SessionService> _logger;

  public SessionService(ISessionDatabaseProvider sessionDatabaseProvider, ICacheServiceProvider cache, ILogger<SessionService> logger)
  {
    _sessionDatabaseProvider = sessionDatabaseProvider;
    _cache = cache;
    _logger = logger;
  }

  public async Task<ChatSession> GetOrCreateSessionAsync(Guid userId, Guid? specificSessionId = null)
  {
    if (specificSessionId.HasValue && specificSessionId != Guid.Empty)
    {
      string cacheKey = $"session:{specificSessionId.Value}";
      var cachedSession = await _cache.GetAsync<ChatSession>(cacheKey);

      if (cachedSession != null && cachedSession.UserId == userId)
      {
        _logger.LogDebug("Cache hit for session {SessionId}", specificSessionId);
        return cachedSession;
      }

      _logger.LogDebug("Cache miss for session {SessionId}, fetching from DB", specificSessionId);
      var existingSession = await _sessionDatabaseProvider.GetSessionAsync(specificSessionId.Value);

      if (existingSession != null && existingSession.UserId == userId)
      {
        await _cache.SetAsync(cacheKey, existingSession);
        return existingSession;
      }

      throw new KeyNotFoundException($"Session {specificSessionId} does not exist or access is denied.");
    }

    var newSession = new ChatSession
    {
      SessionId = Guid.NewGuid(),
      UserId = userId,
      IsBookmarked = false,
      CreatedDate = DateTime.UtcNow
    };

    await _sessionDatabaseProvider.CreateSessionAsync(newSession);
    await _cache.SetAsync($"session:{newSession.SessionId}", newSession);

    return newSession;
  }

  public async Task<ChatSession> CreateSessionAsync(Guid userId)
  {
    if (userId == Guid.Empty)
    {
      throw new ArgumentException("userId was not provided");
    }

    var newSession = new ChatSession
    {
      SessionId = Guid.NewGuid(),
      UserId = userId,
      IsBookmarked = false,
      CreatedDate = DateTime.UtcNow
    };

    await _sessionDatabaseProvider.CreateSessionAsync(newSession);
    await _cache.SetAsync($"session:{newSession.SessionId}", newSession);
    return newSession;
  }

  public async Task EndSessionAsync(Guid sessionId)
  {
    if (sessionId == Guid.Empty)
    {
      throw new ArgumentException("sessionId was not provided");
    }

    await _cache.RemoveAsync($"session:{sessionId}");
    _logger.LogInformation("Session {SessionId} ended and removed from cache", sessionId);
  }

  public async Task<IReadOnlyList<ChatSession>> GetSessionsByUserAsync(Guid userId)
  {
    if (userId == Guid.Empty)
    {
      throw new ArgumentException("userId was not provided");
    }

    return await _sessionDatabaseProvider.GetSessionsByUserAsync(userId);
  }

  public async Task BookmarkSessionAsync(Guid sessionId, Guid userId, bool isBookmarked)
  {
    if (sessionId == Guid.Empty)
    {
      throw new ArgumentException("sessionId was not provided");
    }

    var session = await _sessionDatabaseProvider.GetSessionAsync(sessionId);
    if (session == null)
    {
      throw new KeyNotFoundException($"Session {sessionId} was not found.");
    }

    if (session.UserId != userId)
    {
      throw new KeyNotFoundException($"Session {sessionId} does not exist or access is denied.");
    }

    await _sessionDatabaseProvider.SetBookmarkAsync(sessionId, isBookmarked);
    var updated = new ChatSession
    {
      SessionId = session.SessionId,
      UserId = session.UserId,
      IsBookmarked = isBookmarked,
      CreatedDate = session.CreatedDate,
      SessionName = session.SessionName
    };
    await _cache.SetAsync($"session:{sessionId}", updated);
  }

  public async Task DeleteSessionAsync(Guid sessionId, Guid userId)
  {
    if (sessionId == Guid.Empty)
    {
      throw new ArgumentException("sessionId was not provided");
    }

    var session = await _sessionDatabaseProvider.GetSessionAsync(sessionId);
    if (session == null)
    {
      throw new KeyNotFoundException($"Session {sessionId} was not found.");
    }

    if (session.UserId != userId)
    {
      throw new KeyNotFoundException($"Session {sessionId} does not exist or access is denied.");
    }

    await _sessionDatabaseProvider.DeleteSessionAsync(sessionId);
    await _cache.RemoveAsync($"session:{sessionId}");
  }

  public async Task UpdateSessionNameAsync(Guid sessionId, string sessionName)
  {
    if (sessionId == Guid.Empty)
    {
      throw new ArgumentException("sessionId was not provided");
    }

    await _sessionDatabaseProvider.UpdateSessionNameAsync(sessionId, sessionName);

    string cacheKey = $"session:{sessionId}";
    var cachedSession = await _cache.GetAsync<ChatSession>(cacheKey);
    if (cachedSession != null)
    {
      var updated = new ChatSession
      {
        SessionId = cachedSession.SessionId,
        UserId = cachedSession.UserId,
        IsBookmarked = cachedSession.IsBookmarked,
        CreatedDate = cachedSession.CreatedDate,
        SessionName = sessionName
      };
      await _cache.SetAsync(cacheKey, updated);
    }
  }
}
