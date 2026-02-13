namespace AIWellness.Auth.DTOs.Responses;

public class RegisterResponse
{
  public required string Token { get; set; }
  public bool RequiresEmailVerification { get; set; }
  public string? Message { get; set; }
}