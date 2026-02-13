namespace AIWellness.Auth.DTOs.Requests;

public class TwoFactorRequest
{
  public required string Email { get; set; }
  public required string Code { get; set; }
}