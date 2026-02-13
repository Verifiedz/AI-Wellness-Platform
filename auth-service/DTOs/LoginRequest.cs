namespace AIWellness.Auth.DTOs
{
  public class LoginRequest
  {
    public required string Email { get; set; }
    public required string Password { get; set; }
  }

  public class LoginResponse
  {
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool RequiresTwoFactor { get; set; }
    public string? Message { get; set; }
    public DateTime? TwoFactorExpiresAt { get; set; }
  }

  public class TwoFactorResponse
  {
    public required string Token { get; set; }
    public required string RefreshToken { get; set; }
    public DateTime ExpiresAt { get; set; }
  }
}