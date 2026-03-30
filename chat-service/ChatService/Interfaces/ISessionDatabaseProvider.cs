namespace ChatService.Interfaces;
using ChatService.Entities;
public interface ISessionDatabaseProvider
{
    Task CreateSessionAsync(ChatSession chatSession);

    Task<ChatSession> GetSessionAsync(Guid sessionId);

    Task SetBookmarkAsync(Guid sessionId, bool isBookmarked);

    Task<IReadOnlyList<ChatSession>> GetSessionsByUserAsync(Guid userId);

    Task DeleteSessionAsync(Guid sessionId);

    Task UpdateSessionNameAsync(Guid sessionId, string sessionName);
}
