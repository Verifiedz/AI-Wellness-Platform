namespace ChatService.DTOs;

public sealed record ChatRequest(int chatUserId, string messageRequest, string Context);
