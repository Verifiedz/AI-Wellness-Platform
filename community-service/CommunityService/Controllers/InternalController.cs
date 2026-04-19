namespace CommunityService.Controllers;

using Microsoft.AspNetCore.Mvc;
using CommunityService.Services;

/// <summary>
/// Internal service-to-service endpoints, protected by the gateway shared secret
/// (enforced in <see cref="Middleware.GatewayAuthMiddleware"/>). Used by the
/// auth-service to cascade user-data deletion when a user deletes their account.
/// </summary>
[ApiController]
[Route("internal")]
public class InternalController : ControllerBase
{
    private readonly ICommunityDbService _db;
    private readonly ILogger<InternalController> _logger;

    public InternalController(ICommunityDbService db, ILogger<InternalController> logger)
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
