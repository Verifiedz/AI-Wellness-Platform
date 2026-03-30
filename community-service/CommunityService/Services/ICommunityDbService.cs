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
}
