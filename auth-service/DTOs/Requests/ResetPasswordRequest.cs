namespace AIWellness.Auth.DTOs.Requests;

public class ResetPasswordRequest
{
  public required string Email { get; set; }
  public required string Code { get; set; }
  public required string NewPassword { get; set; }
  public required string NewPassword2 { get; set; }
}