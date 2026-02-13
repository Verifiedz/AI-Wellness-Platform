namespace AIWellness.Auth.DTOs.Requests;

public class VerifyEmailRequest
{
  public required string Email { get; set; }
  public required string Code { get; set; }
}