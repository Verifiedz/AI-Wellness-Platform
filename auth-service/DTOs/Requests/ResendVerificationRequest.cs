namespace AIWellness.Auth.DTOs.Requests;

public class ResendVerificationRequest
{
  public string? Email { get; set; }
  public string? Username { get; set; }
}