namespace AIWrapperService.DTOs;

/// Response contract for /v1/chat/complete.
public sealed record ChatResponseDto
{

    public required string SessionId { get; init; }
    public required string Model { get; init; }
    public required string Reply { get; init; }
    public required int PromptTokens { get; init; }
    public required int CompletionTokens { get; init; }
}
