// DTOs/RegisterRequest.cs
namespace AIWellness.Auth.DTOs
{
  public class RegisterRequest
  {
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public string? Phone { get; set; }
  }
}