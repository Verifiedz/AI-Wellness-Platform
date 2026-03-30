using ChatService.DTOs;

namespace ChatService.Interfaces;

public interface IChatDatabaseProvider
{
    public Task createChatAsync(Chat chat, CancellationToken cancellationToken = default);

    public Task updateChatAsync(Chat chat);

    public Task deleteChatAsync(Guid chatReferenceId);

    public Task<Chat?> getChatAsync(Guid chatReferenceId, CancellationToken cancellationToken = default);

    public Task<IReadOnlyList<Chat>> getChatsBySessionAsync(Guid sessionId, int limit, int offset, CancellationToken cancellationToken = default);
}
