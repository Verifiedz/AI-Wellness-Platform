namespace NotificationService.Api.UserContext;

/// <summary>
/// Represents the authenticated user extracted from YARP gateway headers
/// This is an immutable record that contains user identity information
/// </summary>
public sealed record AuthenticatedUser
{
    /// <summary>
    /// Unique identifier of the user (from X-User-Id header)
    /// </summary>
    public required Guid UserId { get; init; }

    /// <summary>
    /// Email address of the user (from X-User-Email header)
    /// </summary>
    public required string Email { get; init; }
}