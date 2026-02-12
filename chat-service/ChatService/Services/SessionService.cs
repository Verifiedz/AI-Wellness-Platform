namespace ChatService.Services;
using ChatService.entities;
using System;

using ChatService.DTOs;
using ChatService.Interfaces;
    public class SessionService:ISessionService { 
      private readonly ISessionDatabaseProvider _sessionDatabaseProvider;

      public SessionService(ISessionDatabaseProvider sessionDatabaseProvider){

        _sessionDatabaseProvider = sessionDatabaseProvider;
      }
    
      public async Task<ChatSession> GetOrCreateSessionAsync(Guid UserId, Guid? specificSessionId = null){
       
       if (specificSessionId.HasValue && specificSessionId != Guid.Empty)
    {
        var existingSession = await _sessionDatabaseProvider.getSessionAsync(specificSessionId.Value);
        
        if (existingSession != null && existingSession.UserId == UserId)
        {
            return existingSession;
        }
        else {
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

       return newSession;        
      }


      public async Task<ChatSession> CreateSessionAsync(Guid userID){

        throw new NotImplementedException();
      }
      public Task EndSessionAsync(Guid sessionID){
        throw new NotImplementedException();
      }
    }

