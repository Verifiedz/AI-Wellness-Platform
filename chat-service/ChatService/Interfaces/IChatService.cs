namespace ChatService.Interfaces;
using ChatService.DTOs;

public interface IChatService
{
  Task<ChatResponse> SendChatMessageAsync(ChatRequest chatRequest);
  Task<IReadOnlyList<Chat>> GetChatsbySessionAsync(Guid sessionId, Guid userId);
}
