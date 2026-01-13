using System.ComponentModel.DataAnnotations;

namespace AIWrapperService.DTOs;


/// Request contract for /v1/chat/complete.
public sealed record ChatRequestDto
{
    /// Unique session identifier for tracking conversation context.
    [Required(AllowEmptyStrings = false)]
    public required string SessionId { get; init; }
    
    /// List of chat messages in the conversation.
    [Required]
    [MinLength(1)]
    public required IReadOnlyList<ChatMessageDto> Messages { get; init; }

    /// Optional model name. Defaults to gpt-4o-mini if not specified.
    public string? Model { get; init; }

    /// Sampling temperature. Must be between 0.0 and 1.0.
    [Range(0.0, 1.0)]
    public double Temperature { get; init; } = 0.7;
}
