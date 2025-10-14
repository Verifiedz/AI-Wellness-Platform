using ChatService.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace ChatService.APIs.Clients;


public class AIChatWrapperClient: IChatWrapperClientInterface
{
    [HttpGet("/chatWrapper")]
    public Task<ChatResponse> getChatResponseAsync(ChatRequest chatRequest)
    {
        throw new NotImplementedException();
    }
}
