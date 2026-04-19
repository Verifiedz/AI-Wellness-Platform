namespace AIWellness.Auth.Services.Abstractions;

/// <summary>
/// Client responsible for cascading user-data deletion across all downstream
/// microservices when a user deletes their account. Each call is best-effort —
/// failures are logged but do not block the deletion of the auth record itself,
/// ensuring Apple Guideline 5.1.1(v) and Google User Data policy compliance.
/// </summary>
public interface IUserDataDeletionClient
{
  Task<UserDeletionResult> DeleteAllUserDataAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed record UserDeletionResult(
    bool JournalDeleted,
    bool ChatDeleted,
    bool CommunityDeleted,
    bool NotificationsDeleted,
    IReadOnlyList<string> Errors);
