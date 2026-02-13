namespace AIWellness.Auth.DTOs.Responses;

public class TwoFactorResponse
{
  public required string Token { get; set; }
  public required string RefreshToken { get; set; }
  public DateTime ExpiresAt { get; set; }
}