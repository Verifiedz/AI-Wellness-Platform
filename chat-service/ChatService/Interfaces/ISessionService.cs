namespace ChatService.Interfaces;
using ChatService.entities;
public interface ISessionService{


Task<ChatSession> CreateSessionAsync(Guid userId);

public Task<ChatSession> GetOrCreateSessionAsync(Guid userId, Guid? specificSessionId);

Task EndSessionAsync(Guid SessionId);
Task<IReadOnlyList<ChatSession>> GetSessionsByUserAsync(Guid userId);
Task BookmarkSessionAsync(Guid sessionId, Guid userId, bool isBookmarked);
}
