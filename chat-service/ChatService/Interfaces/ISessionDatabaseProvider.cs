namespace ChatService.Interfaces;
using ChatService.entities;
public interface ISessionDatabaseProvider {

 Task createSessionAsync(ChatSession chatSession);

 Task<ChatSession> getSessionAsync(Guid sessionID);
 
 Task setBookmarkAsync(Guid sessionID, bool isBookmarked);

 Task<IReadOnlyList<ChatSession>> getSessionsbyUserAsync(Guid UserID);

 Task deleteSessionAsync(Guid sessionId);

 Task updateSessionNameAsync(Guid sessionId, string sessionName);

}
