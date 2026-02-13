using ChatService.DTOs;
using Microsoft.AspNetCore.Mvc;
using ChatService.Interfaces;
namespace ChatService.APIs.Clients;

public class ChatWrapperClient:IChatWrapperClientInterface 
{
  private readonly HttpClient _HttpClient;
  public ChatWrapperClient(HttpClient httpClient){

    _HttpClient = httpClient;

  }
    public async Task<ChatResponse> getChatResponseAsync(ChatRequest chatRequest)
    {
      HttpResponseMessage response = await _HttpClient.PostAsJsonAsync("chat/ChatResponse",chatRequest);

      response.EnsureSuccessStatusCode();


      ChatResponse? chatResponse = await response.Content.ReadFromJsonAsync<ChatResponse>();

      if(chatResponse == null){
        throw new NullReferenceException("No ChatResponse was Found");
      }

      return chatResponse;
    }
}

