namespace CommunityService.Controllers;

using Microsoft.AspNetCore.Mvc;
using CommunityService.Models.Requests;
using CommunityService.Models.Responses;
using CommunityService.Services;

[ApiController]
[Route("api/community")]
public class CommunityController : ControllerBase
{
    private readonly ICommunityDbService _db;
    private readonly IContentFilter _contentFilter;
    private readonly ILogger<CommunityController> _logger;

    public CommunityController(
        ICommunityDbService db,
        IContentFilter contentFilter,
        ILogger<CommunityController> logger)
    {
        _db = db;
        _contentFilter = contentFilter;
        _logger = logger;
    }

    private Guid GetUserId()
    {
        // From YARP gateway X-User-Id header, or query param in dev mode
        var header = Request.Headers["X-User-Id"].FirstOrDefault();
        if (Guid.TryParse(header, out var userId)) return userId;

        var query = Request.Query["userId"].FirstOrDefault();
        if (Guid.TryParse(query, out var queryUserId)) return queryUserId;

        throw new UnauthorizedAccessException("User ID not found in request");
    }

    [HttpGet("groups")]
    public async Task<IActionResult> GetGroups()
    {
        var groups = await _db.GetGroupsAsync();
        return Ok(groups);
    }

    [HttpGet("groups/{slug}/posts")]
    public async Task<IActionResult> GetPosts(
        string slug,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var userId = GetUserId();
        var posts = await _db.GetPostsAsync(slug, userId, limit, offset);
        return Ok(posts);
    }

    [HttpPost("groups/{slug}/posts")]
    public async Task<IActionResult> CreatePost(string slug, [FromBody] CreatePostRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var filterRejection = _contentFilter.Validate(request.Content);
        if (filterRejection is not null)
        {
            _logger.LogInformation("Post in {Slug} rejected by content filter", slug);
            return BadRequest(new { error = "content_filtered", message = filterRejection });
        }

        var userId = GetUserId();
        _logger.LogInformation("User {UserId} creating post in group {Slug}", userId, slug);

        var post = await _db.CreatePostAsync(slug, userId, request.Content);
        return StatusCode(201, post);
    }

    [HttpPost("posts/{postId:guid}/reactions")]
    public async Task<IActionResult> AddReaction(Guid postId, [FromBody] AddReactionRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();
        await _db.AddReactionAsync(postId, userId, request.ReactionType);
        return Ok();
    }

    [HttpDelete("posts/{postId:guid}/reactions/{reactionType}")]
    public async Task<IActionResult> RemoveReaction(Guid postId, string reactionType)
    {
        var userId = GetUserId();
        await _db.RemoveReactionAsync(postId, userId, reactionType);
        return NoContent();
    }

    [HttpPost("posts/{postId:guid}/report")]
    public async Task<IActionResult> ReportPost(Guid postId, [FromBody] ReportPostRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();
        await _db.ReportPostAsync(postId, userId, request.Reason);
        return StatusCode(201);
    }

    // ---------------------------------------------------------------------
    // Blocking endpoints (Issue 3 — Apple Guideline 1.2)
    // ---------------------------------------------------------------------

    [HttpGet("blocks")]
    public async Task<IActionResult> GetBlocks()
    {
        var userId = GetUserId();
        var blocks = await _db.GetBlockedUsersAsync(userId);
        return Ok(blocks);
    }

    [HttpPost("posts/{postId:guid}/block")]
    public async Task<IActionResult> BlockPostAuthor(Guid postId, [FromBody] BlockByPostRequest? request)
    {
        var userId = GetUserId();
        var blockedId = await _db.BlockUserByPostAsync(userId, postId, request?.Reason);
        if (blockedId is null)
        {
            return NotFound(new { error = "post_not_found", message = "Unable to find the post author to block." });
        }
        return Ok(new { blockedUserId = blockedId });
    }

    [HttpDelete("blocks/{blockedUserId:guid}")]
    public async Task<IActionResult> Unblock(Guid blockedUserId)
    {
        var userId = GetUserId();
        await _db.UnblockUserAsync(userId, blockedUserId);
        return NoContent();
    }
}
