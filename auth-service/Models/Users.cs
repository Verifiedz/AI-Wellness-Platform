namespace AIWellness.Auth.Models
{
  public class User
  {
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
  }
}