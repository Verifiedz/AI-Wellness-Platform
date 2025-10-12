using ChatService.DTOs;

namespace ChatService.Interfaces;

public interface IChatAPIGatwayInterface
{

    //hello

    public Task forwardChatResponseAsync(ChatResponse chatResponse);

    public Task<ChatRequest> GetChatRequestAsync();
}
