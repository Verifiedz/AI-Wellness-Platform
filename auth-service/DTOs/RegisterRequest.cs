namespace AIWellness.Auth.DTOs
{
  public class RegisterRequest
  {
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public string? Phone { get; set; }
  }

  public class RegisterResponse
  {
    public required string Token { get; set; }
    public bool RequiresEmailVerification { get; set; }
    public string? Message { get; set; }
  }
}