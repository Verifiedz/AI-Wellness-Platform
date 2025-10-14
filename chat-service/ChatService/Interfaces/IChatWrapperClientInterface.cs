using ChatService.DTOs;

namespace ChatService.APIs;

public interface IChatWrapperClientInterface
{
    public Task<ChatResponse> getChatResponseAsync(ChatRequest chatRequest);
}
