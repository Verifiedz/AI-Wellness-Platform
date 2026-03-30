namespace ChatService.entities;

public class ChatSession
{
    public required Guid sessionID { get; init; }
    public Guid UserId { get; init; }
    public bool isBookmarked { get; init; }
    public DateTime createdDate { get; init; }
    public string? SessionName { get; init; }
}
