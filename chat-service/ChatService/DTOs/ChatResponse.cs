namespace ChatService.DTOs;

public sealed record ChatResponse
    (int chatUserId, 
    string message, 
    string Context);
