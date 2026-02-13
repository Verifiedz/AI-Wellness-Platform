namespace AIWellness.Auth.DTOs.Requests;

public class ForgotPasswordRequest
{
  public string? Email { get; set; }
  public string? Username { get; set; }
}