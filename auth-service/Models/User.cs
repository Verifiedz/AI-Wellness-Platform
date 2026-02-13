namespace AIWellness.Auth.Models
{
  public class User
  {
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }
  }

  public class LoginAttempt
  {
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public required string IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool IsSuccessful { get; set; }
    public string? FailureReason { get; set; }
    public DateTime AttemptedAt { get; set; }
  }

  public class VerificationCode
  {
    public Guid CodeId { get; set; }
    public Guid UserId { get; set; }
    public required string Code { get; set; }
    public required string Type { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CodeCreated { get; set; }
    public string? IpAddress { get; set; }
    public int Attempts { get; set; }
  }
}