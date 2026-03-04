namespace NotificationService.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using NotificationService.Api.Models.Requests;
using NotificationService.Api.Models.Responses;

/// <summary>
/// Controller for internal service-to-service notification delivery.
/// Protected by an internal API key — not by user-context middleware.
/// </summary>
[ApiController]
[Route("api/notifications")]
public class NotificationCodeController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<NotificationCodeController> _logger;

    public NotificationCodeController(
        IConfiguration configuration,
        ILogger<NotificationCodeController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Receive a verification / 2FA / password-reset code from the Auth Service
    /// and deliver it to the user (log-only placeholder for now).
    /// </summary>
    [HttpPost("send-code")]
    [ProducesResponseType(typeof(SendCodeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public IActionResult SendCode([FromBody] SendCodeRequest request)
    {
        if (!ValidateApiKey())
        {
            _logger.LogWarning("send-code called with invalid or missing API key");
            return Unauthorized(new ErrorResponse
            {
                Error = "Unauthorized",
                Message = "Invalid or missing X-Internal-Api-Key header",
                Timestamp = DateTime.UtcNow
            });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(new ErrorResponse
            {
                Error = "ValidationError",
                Message = "Invalid request data",
                Timestamp = DateTime.UtcNow,
                Details = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage))
            });
        }

        _logger.LogInformation(
            "Verification code received — Type: {Type}, Email: {Email}, UserId: {UserId}",
            request.Type, request.Email, request.UserId);

        return Ok(new SendCodeResponse
        {
            Success = true,
            Message = $"Code delivery queued for {request.Email} (type: {request.Type})"
        });
    }

    private bool ValidateApiKey()
    {
        var requireSecret = _configuration.GetValue<bool>("Gateway:RequireSharedSecret");
        if (!requireSecret)
            return true;

        var expectedKey = _configuration["Gateway:SharedSecret"] ?? "";
        var providedKey = Request.Headers["X-Internal-Api-Key"].ToString();

        return !string.IsNullOrEmpty(expectedKey) && expectedKey == providedKey;
    }
}
