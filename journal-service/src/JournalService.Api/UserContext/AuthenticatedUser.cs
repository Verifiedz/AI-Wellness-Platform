namespace JournalService.Api.UserContext;

public sealed record AuthenticatedUser
{
    public required Guid UserId { get; init; }
    public required string Email { get; init; }
}
