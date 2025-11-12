namespace AIWrapperService.DTOs;

public sealed record ChatRequestDto(
    string SessionId,
    List<ChatMessageDto> Messages,
    string? Model = "gpt-4o-mini",
    double? Temperature = 0.4
);
