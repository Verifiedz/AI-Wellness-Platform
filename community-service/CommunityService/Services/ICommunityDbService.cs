namespace CommunityService.Services;

using CommunityService.Models.Responses;

/// <summary>
/// Abstraction over the community database layer, enabling unit testing
/// of controller actions without a live PostgreSQL connection.
/// </summary>
public interface ICommunityDbService
{
    Task<List<GroupResponse>> GetGroupsAsync();

    Task<List<PostResponse>> GetPostsAsync(string slug, Guid currentUserId, int limit, int offset);

    Task<PostResponse> CreatePostAsync(string slug, Guid userId, string content);

    Task AddReactionAsync(Guid postId, Guid userId, string reactionType);

    Task RemoveReactionAsync(Guid postId, Guid userId, string reactionType);

    Task ReportPostAsync(Guid postId, Guid reporterId, string reason);

    /// <summary>
    /// Block another community member. Blocked users' posts and replies become
    /// invisible to the blocker. Required by Apple Guideline 1.2 for any app
    /// that hosts user-generated content.
    /// </summary>
    Task BlockUserAsync(Guid blockerId, Guid blockedId, string? reason = null);

    /// <summary>
    /// Remove an existing block so the blocked user's content becomes visible again.
    /// </summary>
    Task UnblockUserAsync(Guid blockerId, Guid blockedId);

    /// <summary>
    /// Return the list of user ids the caller has blocked.
    /// </summary>
    Task<IReadOnlyList<BlockedUserResponse>> GetBlockedUsersAsync(Guid blockerId);

    /// <summary>
    /// Block-by-post helper: resolves the post's author and inserts a block
    /// for (<paramref name="blockerId"/> → author). Returns the blocked user
    /// id, or null if the post was not found.
    /// </summary>
    Task<Guid?> BlockUserByPostAsync(Guid blockerId, Guid postId, string? reason = null);

    /// <summary>
    /// Permanently removes all data belonging to the given user: posts, reactions,
    /// reports they filed, and anonymous identities. Called by auth-service during
    /// account deletion (Apple Guideline 5.1.1(v)).
    /// </summary>
    Task DeleteUserDataAsync(Guid userId);
}
