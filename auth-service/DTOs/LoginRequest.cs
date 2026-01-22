// DTOs/LoginRequest.cs
namespace AIWellness.Auth.DTOs
{
  public class LoginRequest
  {
    public required string Email { get; set; }
    public required string Password { get; set; }
  }
}