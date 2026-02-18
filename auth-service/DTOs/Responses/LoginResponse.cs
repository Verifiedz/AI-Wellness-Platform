namespace AIWellness.Auth.DTOs.Responses;

public class LoginResponse
{
  public string? Token { get; set; }
  public string? RefreshToken { get; set; }
  public DateTime? ExpiresAt { get; set; }
  public bool RequiresTwoFactor { get; set; }
  public string? Message { get; set; }
  public DateTime? TwoFactorExpiresAt { get; set; }
}