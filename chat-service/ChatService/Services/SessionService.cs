namespace ChatService.Services;
using ChatService.entities;
using System;

using ChatService.DTOs;
using ChatService.Interfaces;
    public class SessionService:ISessionService { 
      private readonly ISessionDatabaseProvider _sessionDatabaseProvider;
     private readonly ICacheServiceProvider _cache;

      public SessionService(ISessionDatabaseProvider sessionDatabaseProvider, ICacheServiceProvider cache){

        _sessionDatabaseProvider = sessionDatabaseProvider;
        _cache = cache;
      }
    
      public async Task<ChatSession> GetOrCreateSessionAsync(Guid UserId, Guid? specificSessionId = null)
{
    if (specificSessionId.HasValue && specificSessionId != Guid.Empty)
    {
        string cacheKey = $"session:{specificSessionId.Value}";

        var cachedSession = await _cache.GetAsync<ChatSession>(cacheKey);
        
        if (cachedSession != null)
        {
            if (cachedSession.UserId == UserId)
            {
                Console.WriteLine($"[CACHE HIT] Session {specificSessionId} found in Redis.");
                return cachedSession;
            }
        }

        Console.WriteLine($"[CACHE MISS] Fetching session {specificSessionId} from DB.");
        var existingSession = await _sessionDatabaseProvider.getSessionAsync(specificSessionId.Value);
        
        if (existingSession != null && existingSession.UserId == UserId)
        {
           await _cache.SetAsync(cacheKey, existingSession);
            return existingSession;
        }
        else 
        {
             throw new KeyNotFoundException($"Session {specificSessionId} does not exist or access is denied.");
        }
    }        

    var newSession = new ChatSession {
        sessionID = Guid.NewGuid(),
        UserId = UserId,
        isBookmarked = false,
        createdDate = DateTime.UtcNow
   };

    await _sessionDatabaseProvider.createSessionAsync(newSession);

    await _cache.SetAsync($"session:{newSession.sessionID}", newSession);

    return newSession;        
}

      public async Task<ChatSession> CreateSessionAsync(Guid userID){

        throw new NotImplementedException();
      }
      public Task EndSessionAsync(Guid sessionID){
        throw new NotImplementedException();
      }
    }

