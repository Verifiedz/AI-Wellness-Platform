using AIWellness.Auth.DTOs.Requests;
using AIWellness.Auth.DTOs.Responses;
using AIWellness.Auth.Services.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AIWellness.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
  private readonly IAuthService _authService;
  private readonly ILogger<AuthController> _logger;

  public AuthController(IAuthService authService, ILogger<AuthController> logger)
  {
    _authService = authService;
    _logger = logger;
  }

  [HttpPost("register")]
  public async Task<IActionResult> Register([FromBody] RegisterRequest request)
  {
    try
    {
      var result = await _authService.RegisterAsync(request);
      _logger.LogInformation($"User registered successfully: {request.Email}");
      return Ok(result);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, $"Registration failed for email: {request.Email}");
      return BadRequest(new { message = ex.Message });
    }
  }

  [HttpPost("login")]
  public async Task<IActionResult> Login([FromBody] LoginRequest request)
  {
    try
    {
      var result = await _authService.LoginAsync(request);
      _logger.LogInformation($"Login initiated for: {request.Email}");
      return Ok(result);
    }
    catch (Exception ex)
    {
      _logger.LogWarning($"Login failed for email: {request.Email}. Reason: {ex.Message}");
      return Unauthorized(new { message = ex.Message });
    }
  }

  [HttpPost("verify-2fa")]
  public async Task<IActionResult> VerifyTwoFactor([FromBody] TwoFactorRequest request)
  {
    try
    {
      var result = await _authService.VerifyTwoFactorAsync(request);
      _logger.LogInformation($"2FA verified successfully for: {request.Email}");
      return Ok(result);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, $"2FA verification failed for: {request.Email}");
      return BadRequest(new { message = ex.Message });
    }
  }

  [HttpPost("verify-email")]
  public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
  {
    try
    {
      await _authService.VerifyEmailAsync(request.Email, request.Code);
      _logger.LogInformation($"Email verified successfully: {request.Email}");
      return Ok(new { message = "Email verified successfully" });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, $"Email verification failed: {request.Email}");
      return BadRequest(new { message = ex.Message });
    }
  }

  [HttpPost("resend-verification")]
  public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
  {
    try
    {
      await _authService.ResendVerificationEmailAsync(request);
      _logger.LogInformation($"Verification email resent: {request.Email ?? request.Username}");
      return Ok(new { message = "Verification email sent if account exists" });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, $"Failed to resend verification: {request.Email ?? request.Username}");
      return BadRequest(new { message = ex.Message });
    }
  }

  [HttpPost("forgot-password")]
  public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
  {
    try
    {
      await _authService.InitiatePasswordResetAsync(request);
      _logger.LogInformation($"Password reset initiated: {request.Email ?? request.Username}");
      return Ok(new { message = "If account exists, reset instructions sent" });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, $"Password reset failed: {request.Email ?? request.Username}");
      return BadRequest(new { message = ex.Message });
    }
  }

  [HttpPost("reset-password")]
  public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
  {
    try
    {
      await _authService.ResetPasswordAsync(request);
      _logger.LogInformation($"Password reset successful: {request.Email}");
      return Ok(new { message = "Password reset successful" });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, $"Password reset failed: {request.Email}");
      return BadRequest(new { message = ex.Message });
    }
  }

  [Authorize]
  [HttpPost("change-password")]
  public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
  {
    try
    {
      var tokenEmail = User.FindFirst(ClaimTypes.Email)?.Value;
      if (string.IsNullOrEmpty(tokenEmail))
        return Unauthorized(new { message = "Invalid token" });

      if (tokenEmail != request.Email)
        return BadRequest(new { message = "Email mismatch with authenticated user" });

      await _authService.ChangePasswordAsync(request);
      _logger.LogInformation($"Password changed successfully for: {request.Email}");
      return Ok(new { message = "Password changed successfully" });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Password change failed");
      return BadRequest(new { message = ex.Message });
    }
  }

  [Authorize]
  [HttpGet("user-info")]
  public async Task<IActionResult> GetUserInfo()
  {
    try
    {
      var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
      if (string.IsNullOrEmpty(userEmail))
        return Unauthorized(new { message = "Invalid token" });

      var userInfo = await _authService.GetUserInfoAsync(userEmail);
      return Ok(userInfo);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to get user info");
      return BadRequest(new { message = ex.Message });
    }
  }

  [Authorize]
  [HttpGet("user-info/{email}")]
  public async Task<IActionResult> GetUserInfoByEmail(string email)
  {
    try
    {
      var userInfo = await _authService.GetUserInfoAsync(email);
      return Ok(userInfo);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, $"Failed to get user info for: {email}");
      return BadRequest(new { message = ex.Message });
    }
  }

  [HttpGet("health")]
  public IActionResult HealthCheck()
  {
    return Ok(new
    {
      status = "healthy",
      timestamp = DateTime.UtcNow,
      service = "AuthService"
    });
  }
}