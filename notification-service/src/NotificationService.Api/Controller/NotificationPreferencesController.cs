namespace NotificationService.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using NotificationService.Api.Models.Requests;
using NotificationService.Api.Models.Responses;
using NotificationService.Api.Services;
using NotificationService.Api.UserContext;

/// <summary>
/// Controller for managing user notification preferences
/// All endpoints require authentication via YARP gateway (X-User-Id header)
/// </summary>
[ApiController]
[Route("api/notifications")]
public class NotificationPreferencesController : ControllerBase
{
    private readonly IUserContext _userContext;
    private readonly NotificationService _notificationService;
    private readonly ILogger<NotificationPreferencesController> _logger;

    public NotificationPreferencesController(
        IUserContext userContext,
        NotificationService notificationService,
        ILogger<NotificationPreferencesController> logger)
    {
        _userContext = userContext;
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// Get current user's notification preferences
    /// </summary>
    /// <response code="200">Returns user preferences</response>
    /// <response code="404">User preferences not found</response>
    /// <response code="401">Unauthorized - missing user context</response>
    [HttpGet("preferences")]
    [ProducesResponseType(typeof(PreferencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPreferences()
    {
        try
        {
            // Get current user from context (extracted from YARP headers by middleware)
            var userId = _userContext.CurrentUser.UserId;

            _logger.LogInformation("Getting preferences for user {UserId}", userId);

            var preferences = await _notificationService.GetUserPreferencesAsync(userId);

            if (preferences == null)
            {
                return NotFound(new ErrorResponse
                {
                    Error = "NotFound",
                    Message = "User preferences not found. Please create preferences first.",
                    Timestamp = DateTime.UtcNow
                });
            }

            return Ok(preferences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting preferences");
            throw; // Let global error handler deal with it
        }
    }

    /// <summary>
    /// Create or update user notification preferences
    /// </summary>
    /// <param name="request">Preference settings</param>
    /// <response code="200">Preferences updated successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">Unauthorized - missing user context</response>
    [HttpPost("preferences")]
    [ProducesResponseType(typeof(PreferencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesRequest request)
    {
        try
        {
            // Validate model
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

            // Get current user from context
            var userId = _userContext.CurrentUser.UserId;

            _logger.LogInformation("Updating preferences for user {UserId}", userId);

            var preferences = await _notificationService.UpdateUserPreferencesAsync(userId, request);

            return Ok(preferences);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument when updating preferences");
            return BadRequest(new ErrorResponse
            {
                Error = "InvalidArgument",
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating preferences");
            throw;
        }
    }

    /// <summary>
    /// Register or update device token for push notifications
    /// </summary>
    /// <param name="request">Device token</param>
    /// <response code="200">Device token registered successfully</response>
    /// <response code="400">Invalid device token</response>
    /// <response code="401">Unauthorized - missing user context</response>
    [HttpPost("register-device")]
    [ProducesResponseType(typeof(DeviceRegistrationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterDevice([FromBody] RegisterDeviceRequest request)
    {
        try
        {
            // Validate model
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

            // Get current user from context
            var userId = _userContext.CurrentUser.UserId;

            _logger.LogInformation("Registering device token for user {UserId}", userId);

            var result = await _notificationService.RegisterDeviceTokenAsync(userId, request.DeviceToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument when registering device");
            return BadRequest(new ErrorResponse
            {
                Error = "InvalidArgument",
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering device token");
            throw;
        }
    }
}