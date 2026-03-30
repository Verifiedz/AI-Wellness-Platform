using ChatService.Enums;

namespace ChatService.DTOs;

public class Chat
{
    public Guid ChatUserId { get; set; }
    public Guid ChatReferenceId { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid SessionId { get; set; }
    public required Status Status { get; set; }
    public bool IsBookmarked { get; set; }
    public DateTime CreatedDate { get; set; }
}
