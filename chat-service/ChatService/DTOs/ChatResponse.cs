namespace ChatService.DTOs;

public sealed record ChatResponse
    (int chatUserId,
    Guid chatReferenceId, 
    string message, 
    string Context);