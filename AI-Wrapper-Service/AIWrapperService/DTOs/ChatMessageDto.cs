using System.ComponentModel.DataAnnotations;
using AIWrapperService.Enums;

namespace AIWrapperService.DTOs;

/// A single chat message.
public sealed record ChatMessageDto
{
    /// The role of the message sender (System, User, or Assistant).
    [Required]
    public required Role Role { get; init; }

    /// The content of the message. Cannot be empty.
    [Required(AllowEmptyStrings = false)]
    public required string Content { get; init; }
}