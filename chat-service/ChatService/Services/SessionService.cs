namespace ChatService.Services;
using ChatService.entities;
using ChatService.Interfaces;
using Microsoft.Extensions.Logging;
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
      var existingSession = await _sessionDatabaseProvider.getSessionAsync(specificSessionId.Value);
        
      if (existingSession != null && existingSession.UserId == userId)
      {
        await _cache.SetAsync(cacheKey, existingSession);
        return existingSession;
      }

      throw new KeyNotFoundException($"Session {specificSessionId} does not exist or access is denied.");
    }        

    var newSession = new ChatSession
    {
      sessionID = Guid.NewGuid(),
      UserId = userId,
      isBookmarked = false,
      createdDate = DateTime.UtcNow
    };

    await _sessionDatabaseProvider.createSessionAsync(newSession);
    await _cache.SetAsync($"session:{newSession.sessionID}", newSession);

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
      sessionID = Guid.NewGuid(),
      UserId = userId,
      isBookmarked = false,
      createdDate = DateTime.UtcNow
    };

    await _sessionDatabaseProvider.createSessionAsync(newSession);
    await _cache.SetAsync($"session:{newSession.sessionID}", newSession);
    return newSession;
  }

  public Task EndSessionAsync(Guid sessionId)
  {
    throw new NotImplementedException();
  }

  public async Task<IReadOnlyList<ChatSession>> GetSessionsByUserAsync(Guid userId)
  {
    if (userId == Guid.Empty)
    {
      throw new ArgumentException("userId was not provided");
    }

    return await _sessionDatabaseProvider.getSessionsbyUserAsync(userId);
  }

  public async Task BookmarkSessionAsync(Guid sessionId, Guid userId, bool isBookmarked)
  {
    if (sessionId == Guid.Empty)
    {
      throw new ArgumentException("sessionId was not provided");
    }

    var session = await _sessionDatabaseProvider.getSessionAsync(sessionId);
    if (session == null)
    {
      throw new KeyNotFoundException($"Session {sessionId} was not found.");
    }

    if (session.UserId != userId)
    {
      throw new KeyNotFoundException($"Session {sessionId} does not exist or access is denied.");
    }

    await _sessionDatabaseProvider.setBookmarkAsync(sessionId, isBookmarked);
    session.isBookmarked = isBookmarked;
    await _cache.SetAsync($"session:{sessionId}", session);
  }
}

