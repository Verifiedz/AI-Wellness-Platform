namespace ChatService.Interfaces;
using ChatService.DTOs;

public interface IChatService
{
    Task<ChatResponse> SendChatMessageAsync(ChatRequest chatRequest, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Chat>> GetChatsbySessionAsync(Guid sessionId, Guid userId, int limit = 50, int offset = 0, CancellationToken cancellationToken = default);
}
