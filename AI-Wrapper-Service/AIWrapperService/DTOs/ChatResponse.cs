namespace AIWrapperService.DTOs;

public sealed record ChatResponse(
    Guid chatUserId,
    string message,
    string Context,
    Guid sessionId);
