namespace ChatService.APIs.Clients;
using Microsoft.AspNetCore.Mvc;
using ChatService.Interfaces;
using ChatService.DTOs;


public class ChatAPIGatewayClient: IChatAPIGatwayInterface
{
  [HttpGet("/chatApiGateway")]
  public Task<ChatRequest> GetChatRequestAsync(ChatRequest chatRequest)
  {
    throw new NotImplementedException();
  }
}
