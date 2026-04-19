namespace CommunityService.Models.Requests;

using System.ComponentModel.DataAnnotations;

public sealed record CreatePostRequest(
    [Required]
    [MaxLength(1000)]
    string Content,

    Guid? ParentId = null
);

public sealed record AddReactionRequest(
    [Required]
    [RegularExpression("^(hug|heart|strength|relate)$", ErrorMessage = "Invalid reaction type")]
    string ReactionType
);

public sealed record ReportPostRequest(
    [Required]
    [MaxLength(200)]
    string Reason
);

public sealed record BlockByPostRequest(
    [MaxLength(200)] string? Reason
);
