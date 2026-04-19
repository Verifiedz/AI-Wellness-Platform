using ChatService.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatService.Controllers;

/// <summary>
/// Service-to-service endpoints. Authenticated by the <c>X-Internal-Api-Key</c> header
/// matching <c>Gateway:SharedSecret</c>, NOT by the end-user JWT. Called by auth-service
/// during account deletion (Apple Guideline 5.1.1(v), Google User Data policy).
/// </summary>
[ApiController]
[Route("internal")]
[AllowAnonymous]
public class InternalController : ControllerBase
{
    private const string ApiKeyHeader = "X-Internal-Api-Key";

    private readonly IChatDatabaseProvider _chatDb;
    private readonly ISessionService _sessionService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<InternalController> _logger;

    public InternalController(
        IChatDatabaseProvider chatDb,
        ISessionService sessionService,
        IConfiguration configuration,
        ILogger<InternalController> logger)
    {
        _chatDb = chatDb;
        _sessionService = sessionService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpDelete("users/{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId, CancellationToken cancellationToken)
    {
        if (!IsAuthorized())
        {
            _logger.LogWarning("Internal delete-user call rejected: missing or invalid API key");
            return Unauthorized(new { message = "Invalid internal API key" });
        }

        _logger.LogInformation("Internal delete-user request for {UserId}", userId);
        await _chatDb.DeleteChatsByUserAsync(userId, cancellationToken);
        return NoContent();
    }

    private bool IsAuthorized()
    {
        var expected = _configuration["Gateway:SharedSecret"];
        if (string.IsNullOrEmpty(expected))
        {
            // Fail closed if the secret was never configured.
            return false;
        }

        if (!Request.Headers.TryGetValue(ApiKeyHeader, out var provided) || provided.Count == 0)
        {
            return false;
        }

        // Constant-time comparison to avoid leaking key material via timing.
        var expectedBytes = System.Text.Encoding.UTF8.GetBytes(expected);
        var providedBytes = System.Text.Encoding.UTF8.GetBytes(provided.ToString());
        return System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes);
    }
}
