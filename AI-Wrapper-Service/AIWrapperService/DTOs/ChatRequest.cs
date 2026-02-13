namespace AIWrapperService.DTOs;

public sealed record ChatRequest(
    Guid chatUserId,
    string messageRequest,
    string Context,
    Guid? sessionId);


