namespace CommunityService.Tests.Controllers;

using Xunit;
using CommunityService.Controllers;
using CommunityService.Models.Requests;
using CommunityService.Models.Responses;
using CommunityService.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

public class CommunityControllerTests
{
    private readonly Mock<ICommunityDbService> _dbMock;
    private readonly Mock<ILogger<CommunityController>> _loggerMock;
    private readonly CommunityController _sut;

    public CommunityControllerTests()
    {
        _dbMock = new Mock<ICommunityDbService>();
        _loggerMock = new Mock<ILogger<CommunityController>>();
        _sut = new CommunityController(_dbMock.Object, _loggerMock.Object);
    }

    // ------------------------------------------------------------------ //
    // Helpers
    // ------------------------------------------------------------------ //

    private static void SetUserId(CommunityController controller, Guid userId)
    {
        var context = new DefaultHttpContext();
        context.Request.Headers["X-User-Id"] = userId.ToString();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = context
        };
    }

    private static PostResponse BuildPost(
        Guid postId,
        Guid groupId,
        string content = "Hello community",
        DateTime? createdAt = null) =>
        new(postId, groupId, "Brave Owl", 42, content, null, 0,
            new Dictionary<string, int>(), [], createdAt ?? DateTime.UtcNow);

    // ------------------------------------------------------------------ //
    // GetGroups
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetGroups_ReturnsOkWithGroupList()
    {
        // Arrange
        var groups = new List<GroupResponse>
        {
            new(Guid.NewGuid(), "Anxiety Support", "anxiety", "A safe space", "shield", 10, 25),
            new(Guid.NewGuid(), "Grief Circle",    "grief",   "Healing together", "heart", 5,  12)
        };

        _dbMock.Setup(db => db.GetGroupsAsync()).ReturnsAsync(groups);

        SetUserId(_sut, Guid.NewGuid());

        // Act
        var result = await _sut.GetGroups();

        // Assert
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(groups);
    }

    // ------------------------------------------------------------------ //
    // GetPosts
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetPosts_ReturnsOkWithPostList()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var groupId = Guid.NewGuid();
        var posts = new List<PostResponse>
        {
            BuildPost(Guid.NewGuid(), groupId, "Post 1"),
            BuildPost(Guid.NewGuid(), groupId, "Post 2")
        };

        _dbMock.Setup(db => db.GetPostsAsync("anxiety", userId, 20, 0))
               .ReturnsAsync(posts);

        SetUserId(_sut, userId);

        // Act
        var result = await _sut.GetPosts("anxiety");

        // Assert
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedPosts = ok.Value.Should().BeAssignableTo<List<PostResponse>>().Subject;
        returnedPosts.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetPosts_WithoutUserId_ThrowsUnauthorizedAccessException()
    {
        // Arrange — no user context set on the HTTP request
        var context = new DefaultHttpContext();
        _sut.ControllerContext = new ControllerContext { HttpContext = context };

        // Act & Assert
        await _sut.Invoking(c => c.GetPosts("anxiety"))
                  .Should().ThrowAsync<UnauthorizedAccessException>()
                  .WithMessage("*User ID not found*");
    }

    // ------------------------------------------------------------------ //
    // CreatePost
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task CreatePost_WithValidData_Returns201WithPost()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var groupId = Guid.NewGuid();
        var request = new CreatePostRequest("I need some support today.");
        var createdPost = BuildPost(Guid.NewGuid(), groupId, request.Content);

        _dbMock.Setup(db => db.CreatePostAsync("anxiety", userId, request.Content))
               .ReturnsAsync(createdPost);

        SetUserId(_sut, userId);

        // Act
        var result = await _sut.CreatePost("anxiety", request);

        // Assert
        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(201);
        statusResult.Value.Should().BeEquivalentTo(createdPost);

        _dbMock.Verify(db => db.CreatePostAsync("anxiety", userId, request.Content), Times.Once);
    }

    [Fact]
    public async Task CreatePost_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange — simulate model validation failure
        var userId = Guid.NewGuid();
        SetUserId(_sut, userId);
        _sut.ModelState.AddModelError("Content", "Content is required.");

        // Act
        var result = await _sut.CreatePost("anxiety", new CreatePostRequest(""));

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();

        _dbMock.Verify(db => db.CreatePostAsync(
            It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task CreatePost_WithoutUserId_ThrowsUnauthorizedAccessException()
    {
        // Arrange — no X-User-Id header
        var context = new DefaultHttpContext();
        _sut.ControllerContext = new ControllerContext { HttpContext = context };

        // Act & Assert
        await _sut.Invoking(c => c.CreatePost("anxiety", new CreatePostRequest("Hello")))
                  .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    // ------------------------------------------------------------------ //
    // AddReaction
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task AddReaction_WithValidData_ReturnsOk()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var request = new AddReactionRequest("hug");

        _dbMock.Setup(db => db.AddReactionAsync(postId, userId, "hug"))
               .Returns(Task.CompletedTask);

        SetUserId(_sut, userId);

        // Act
        var result = await _sut.AddReaction(postId, request);

        // Assert
        result.Should().BeOfType<OkResult>();

        _dbMock.Verify(db => db.AddReactionAsync(postId, userId, "hug"), Times.Once);
    }

    [Fact]
    public async Task AddReaction_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        SetUserId(_sut, userId);
        _sut.ModelState.AddModelError("ReactionType", "Invalid reaction type.");

        // Act
        var result = await _sut.AddReaction(Guid.NewGuid(), new AddReactionRequest("invalid_type"));

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ------------------------------------------------------------------ //
    // RemoveReaction
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task RemoveReaction_WithValidData_ReturnsNoContent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();

        _dbMock.Setup(db => db.RemoveReactionAsync(postId, userId, "heart"))
               .Returns(Task.CompletedTask);

        SetUserId(_sut, userId);

        // Act
        var result = await _sut.RemoveReaction(postId, "heart");

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    // ------------------------------------------------------------------ //
    // ReportPost
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task ReportPost_WithValidData_Returns201()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var request = new ReportPostRequest("Spam content");

        _dbMock.Setup(db => db.ReportPostAsync(postId, userId, request.Reason))
               .Returns(Task.CompletedTask);

        SetUserId(_sut, userId);

        // Act
        var result = await _sut.ReportPost(postId, request);

        // Assert
        var statusResult = result.Should().BeOfType<StatusCodeResult>().Subject;
        statusResult.StatusCode.Should().Be(201);
    }
}
