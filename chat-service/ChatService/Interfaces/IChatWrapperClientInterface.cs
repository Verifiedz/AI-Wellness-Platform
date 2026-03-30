using ChatService.DTOs;

namespace ChatService.Interfaces;

public interface IChatWrapperClientInterface
{
    public Task<ChatResponse> getChatResponseAsync(ChatRequest chatRequest, CancellationToken cancellationToken = default);
}
