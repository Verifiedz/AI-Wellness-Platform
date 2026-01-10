using ChatService.DTOs;
using Microsoft.AspNetCore.Mvc;
using ChatService.Interfaces;
namespace ChatService.APIs.Clients;

public class ChatWrapperClientInterface:IChatWrapperClientInterface 
{
    [HttpGet("/chatWrapper")]
    public Task<ChatResponse> getChatResponseAsync(ChatRequest chatRequest)
    {
        throw new NotImplementedException();
    }
}
