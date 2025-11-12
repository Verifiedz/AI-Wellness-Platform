using AIWrapperService.Enums;

namespace AIWrapperService.DTOs;

public sealed record ChatMessageDto(Role Role, string Content);
