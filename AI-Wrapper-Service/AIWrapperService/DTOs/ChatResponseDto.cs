namespace AIWrapperService.DTOs;

public sealed record ChatResponseDto(
    string SessionId,
    string Model,
    string Reply,
    int PromptTokens,
    int CompletionTokens
);
