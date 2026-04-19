using AIWellness.Auth.DTOs.Requests;
using AIWellness.Auth.DTOs.Responses;
using AIWellness.Auth.Services.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
    var result = await _authService.RegisterAsync(request);
    _logger.LogInformation("User registered successfully: {Email}", request.Email);
    return Ok(result);
  }

  [HttpPost("login")]
  [EnableRateLimiting("login")]
  public async Task<IActionResult> Login([FromBody] LoginRequest request)
  {
    var result = await _authService.LoginAsync(request);
    _logger.LogInformation("Login initiated for: {Email}", request.Email);
    return Ok(result);
  }

  [HttpPost("verify-2fa")]
  public async Task<IActionResult> VerifyTwoFactor([FromBody] TwoFactorRequest request)
  {
    var result = await _authService.VerifyTwoFactorAsync(request);
    _logger.LogInformation("2FA verified successfully for: {Email}", request.Email);
    return Ok(result);
  }

  [HttpPost("verify-email")]
  public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
  {
    await _authService.VerifyEmailAsync(request.Email, request.Code);
    _logger.LogInformation("Email verified successfully: {Email}", request.Email);
    return Ok(new { message = "Email verified successfully" });
  }

  [HttpPost("resend-verification")]
  public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
  {
    await _authService.ResendVerificationEmailAsync(request);
    _logger.LogInformation("Verification email resent: {Identifier}", request.Email ?? request.Username);
    return Ok(new { message = "Verification email sent if account exists" });
  }

  [HttpPost("forgot-password")]
  public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
  {
    await _authService.InitiatePasswordResetAsync(request);
    _logger.LogInformation("Password reset initiated: {Identifier}", request.Email ?? request.Username);
    return Ok(new { message = "If account exists, reset instructions sent" });
  }

  [HttpPost("reset-password")]
  public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
  {
    await _authService.ResetPasswordAsync(request);
    _logger.LogInformation("Password reset successful: {Email}", request.Email);
    return Ok(new { message = "Password reset successful" });
  }

  [Authorize]
  [HttpPost("change-password")]
  public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
  {
    var tokenEmail = User.FindFirst(ClaimTypes.Email)?.Value;
    if (string.IsNullOrEmpty(tokenEmail))
      return Unauthorized(new { message = "Invalid token" });

    if (tokenEmail != request.Email)
      return BadRequest(new { message = "Email mismatch with authenticated user" });

    await _authService.ChangePasswordAsync(request);
    _logger.LogInformation("Password changed successfully for: {Email}", request.Email);
    return Ok(new { message = "Password changed successfully" });
  }

  [Authorize]
  [HttpGet("user-info")]
  public async Task<IActionResult> GetUserInfo()
  {
    var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
    if (string.IsNullOrEmpty(userEmail))
      return Unauthorized(new { message = "Invalid token" });

    var userInfo = await _authService.GetUserInfoAsync(userEmail);
    return Ok(userInfo);
  }

  [HttpPost("refresh")]
  [AllowAnonymous]
  public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
  {
    var result = await _authService.RefreshTokenAsync(request.RefreshToken);
    return Ok(result);
  }

  /// <summary>
  /// Permanently deletes the authenticated user's account and cascades deletion
  /// to all downstream services. Required by Apple App Store Guideline 5.1.1(v)
  /// and Google Play User Data policy. Requires password re-authentication.
  /// </summary>
  [Authorize]
  [HttpDelete("me")]
  public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
  {
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value;
    if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
      return Unauthorized(new { message = "Invalid token" });

    await _authService.DeleteAccountAsync(userId, request.Password);
    _logger.LogInformation("Account deletion completed for {UserId}", userId);
    return NoContent();
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
