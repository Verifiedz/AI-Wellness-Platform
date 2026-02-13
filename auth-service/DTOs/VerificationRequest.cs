namespace AIWellness.Auth.DTOs
{
  public class VerifyEmailRequest
  {
    public required string Email { get; set; }
    public required string Code { get; set; }
  }

  public class ResendVerificationRequest
  {
    public string? Email { get; set; }
    public string? Username { get; set; }
  }

  public class ForgotPasswordRequest
  {
    public string? Email { get; set; }
    public string? Username { get; set; }
  }

  public class ResetPasswordRequest
  {
    public required string Email { get; set; }
    public required string Code { get; set; }
    public required string NewPassword { get; set; }
    public required string NewPassword2 { get; set; }
  }

  public class ChangePasswordRequest
  {
    public required string Email { get; set; }
    public required string CurrentPassword { get; set; }
    public required string NewPassword { get; set; }
    public required string NewPassword2 { get; set; }
  }

  public class TwoFactorRequest
  {
    public required string Email { get; set; }
    public required string Code { get; set; }
  }

  public class UserInfoResponse
  {
    public Guid UserId { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int FailedLoginAttempts { get; set; }
    public bool IsAccountLocked { get; set; }
    public DateTime? LockedUntil { get; set; }
  }
}