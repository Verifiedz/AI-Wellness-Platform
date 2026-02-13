namespace AIWellness.Auth.DTOs.Responses;

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