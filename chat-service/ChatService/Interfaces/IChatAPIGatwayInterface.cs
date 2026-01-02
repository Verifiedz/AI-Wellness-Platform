using ChatService.DTOs;
namespace ChatService.Interfaces;

public interface IChatAPIGatwayInterface
{
    public Task<ChatRequest> GetChatRequestAsync(ChatRequest chatRequest);
}
