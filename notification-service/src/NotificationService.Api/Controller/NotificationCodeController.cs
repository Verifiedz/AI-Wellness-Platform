namespace NotificationService.Api.Controllers;

using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using NotificationService.Api.Models.Requests;
using NotificationService.Api.Models.Responses;
using NotificationService.Api.Services;

/// <summary>
/// Controller for internal service-to-service notification delivery.
/// Protected by an internal API key — not by user-context middleware.
/// </summary>
[ApiController]
[Route("api/notifications")]
public class NotificationCodeController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly CodeDeliveryQueue _codeDeliveryQueue;
    private readonly ILogger<NotificationCodeController> _logger;

    public NotificationCodeController(
        IConfiguration configuration,
        CodeDeliveryQueue codeDeliveryQueue,
        ILogger<NotificationCodeController> logger)
    {
        _configuration = configuration;
        _codeDeliveryQueue = codeDeliveryQueue;
        _logger = logger;
    }

    /// <summary>
    /// Receive a verification / 2FA / password-reset code from the Auth Service
    /// and deliver it to the user via email (SMTP) and/or SMS (Twilio).
    /// </summary>
    [HttpPost("send-code")]
    [ProducesResponseType(typeof(SendCodeResponse), StatusCodes.Status202Accepted)]
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
            "Verification code received - Type: {Type}, Email: {Email}, UserId: {UserId}, Channel: {Channel}",
            request.Type, request.Email, request.UserId, request.Channel);

        // Enqueue and return immediately. The background worker performs the real
        // SMTP/SMS call so slow provider handshakes cannot block the login flow.
        var correlationId = HttpContext.TraceIdentifier;
        var job = new CodeSendJob(
            request.UserId,
            request.Email,
            request.Phone,
            request.Type,
            request.Code,
            request.Channel,
            correlationId,
            DateTime.UtcNow);

        _codeDeliveryQueue.Enqueue(job);

        // 202 Accepted: delivery is in progress, not guaranteed. Response shape
        // is preserved for the existing auth-service caller. Success reflects
        // acceptance of the job, NOT the actual provider outcome — auth-service
        // does not surface these booleans to end users.
        return Accepted(new SendCodeResponse
        {
            Success = true,
            Message = "Code delivery queued."
        });
    }

    private bool ValidateApiKey()
    {
        var requireSecret = _configuration.GetValue<bool>("Gateway:RequireSharedSecret");
        if (!requireSecret)
            return true;

        var expectedKey = _configuration["Gateway:SharedSecret"] ?? "";
        var providedKey = Request.Headers["X-Internal-Api-Key"].ToString();

        if (string.IsNullOrEmpty(expectedKey) || string.IsNullOrEmpty(providedKey))
            return false;

        var expectedBytes = Encoding.UTF8.GetBytes(expectedKey);
        var providedBytes = Encoding.UTF8.GetBytes(providedKey);

        return CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
    }
}
