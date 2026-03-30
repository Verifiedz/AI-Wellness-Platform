using ChatService.DTOs;

namespace ChatService.Interfaces;

public interface IChatWrapperClientInterface
{
    public Task<ChatResponse> GetChatResponseAsync(ChatRequest chatRequest, CancellationToken cancellationToken = default);
}
