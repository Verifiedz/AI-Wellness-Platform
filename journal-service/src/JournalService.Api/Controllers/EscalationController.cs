namespace JournalService.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using JournalService.Api.Services;
using JournalService.Api.UserContext;

[ApiController]
[Route("api/journal/escalation")]
public class EscalationController : ControllerBase
{
    private readonly IUserContext _userContext;
    private readonly EscalationService _escalationService;
    private readonly ILogger<EscalationController> _logger;

    public EscalationController(
        IUserContext userContext,
        EscalationService escalationService,
        ILogger<EscalationController> logger)
    {
        _userContext = userContext;
        _escalationService = escalationService;
        _logger = logger;
    }

    /// <summary>Get escalation recommendation based on recent assessments.</summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(EscalationStatus), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus()
    {
        var userId = _userContext.CurrentUser.UserId;
        var status = await _escalationService.GetStatusAsync(userId);
        return Ok(status);
    }

    /// <summary>Log an escalation event for audit purposes.</summary>
    [HttpPost("log")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> LogEvent([FromBody] LogEscalationRequest request)
    {
        var userId = _userContext.CurrentUser.UserId;
        await _escalationService.LogEventAsync(userId, request.Type, request.Source);
        return NoContent();
    }
}

public sealed record LogEscalationRequest(string Type, string Source);
