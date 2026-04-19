namespace NotificationService.Api.Controller;

using Microsoft.AspNetCore.Mvc;
using NotificationService.Api.Services;

/// <summary>
/// Service-to-service endpoints, authenticated by <see cref="Middleware.GatewayAuthMiddleware"/>.
/// Invoked by auth-service when a user deletes their account (Apple Guideline 5.1.1(v)).
/// </summary>
[ApiController]
[Route("internal")]
public class InternalController : ControllerBase
{
    private readonly DatabaseService _db;
    private readonly ILogger<InternalController> _logger;

    public InternalController(DatabaseService db, ILogger<InternalController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpDelete("users/{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        _logger.LogInformation("Internal delete-user request for {UserId}", userId);
        await _db.DeleteUserDataAsync(userId);
        return NoContent();
    }
}
