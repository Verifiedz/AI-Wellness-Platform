using ChatService.DTOs;

namespace ChatService.Interfaces;

public interface IChatDatabaseProvider
{
    public Task CreateChatAsync(Chat chat, CancellationToken cancellationToken = default);

    public Task UpdateChatAsync(Chat chat);

    public Task DeleteChatAsync(Guid chatReferenceId);

    public Task<Chat?> GetChatAsync(Guid chatReferenceId, CancellationToken cancellationToken = default);

    public Task<IReadOnlyList<Chat>> GetChatsBySessionAsync(Guid sessionId, int limit, int offset, CancellationToken cancellationToken = default);
}
