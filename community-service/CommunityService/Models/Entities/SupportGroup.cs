namespace CommunityService.Models.Entities;

public class SupportGroup
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = "people-outline";
    public DateTime CreatedAt { get; set; }
}

public class Post
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public string AnonymousName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsFlagged { get; set; }
    public bool IsHidden { get; set; }
    public Guid? ParentId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Reaction
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public string ReactionType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class Report
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid ReporterId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
}

public class AnonymousIdentity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid GroupId { get; set; }
    public string AnonymousName { get; set; } = string.Empty;
    public int AvatarSeed { get; set; }
}
