namespace CommunityService.Models.Responses;

public sealed record GroupResponse(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    string Icon,
    int MemberCount,
    int PostCount
);

public sealed record PostResponse(
    Guid Id,
    Guid GroupId,
    string AnonymousName,
    int AvatarSeed,
    string Content,
    Guid? ParentId,
    int ReplyCount,
    Dictionary<string, int> Reactions,
    string[] UserReactions,
    DateTime CreatedAt
);

public sealed record ErrorResponse
{
    public string Error { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public string? Details { get; init; }
}
