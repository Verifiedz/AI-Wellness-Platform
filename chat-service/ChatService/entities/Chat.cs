using ChatService.enums;

namespace ChatService.DTOs;

public class Chat
{
    public Guid chatUserId { get; set; }
    public Guid chatReferenceId { get; set; }
    public string message { get; set; } = string.Empty;
    public Guid sessionId {get; set;}
    public required Status status { get; set; }
    public bool isBookmarked { get; set; }
    public DateTime CreatedDate { get; set; }
}
