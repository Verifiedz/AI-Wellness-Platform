namespace AIWellness.Auth.Database
{
  public interface IUserRepository
  {
    Task<Guid?> CreateUserAsync(string email, string passwordHash);
    Task<(Guid? Id, string? PasswordHash)> GetUserByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
  }
}