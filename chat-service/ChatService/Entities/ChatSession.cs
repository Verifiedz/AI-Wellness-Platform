namespace ChatService.Entities;

public class ChatSession
{
    public required Guid SessionId { get; init; }
    public Guid UserId { get; init; }
    public bool IsBookmarked { get; init; }
    public DateTime CreatedDate { get; init; }
    public string? SessionName { get; init; }
}
