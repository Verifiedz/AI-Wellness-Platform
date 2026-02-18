using AIWellness.Auth.Models;

namespace AIWellness.Auth.Repositories;

public interface IUserRepository
{
  Task<User?> GetByEmailAsync(string email);
  Task<User?> GetByUsernameAsync(string username);
  Task<User?> GetByPhoneAsync(string phone);
  Task<Guid> CreateAsync(User user);
  Task UpdateLastLoginAsync(Guid userId);
  Task IncrementFailedLoginAsync(Guid userId);
  Task LogLoginAttemptAsync(LoginAttempt attempt);
  Task<bool> IsAccountLockedAsync(Guid userId);
  Task UpdatePasswordAsync(Guid userId, string newPasswordHash);
  Task CreateVerificationCodeAsync(Guid userId, string code, string type, string ipAddress);
  Task<bool> VerifyCodeAsync(Guid userId, string code, string type);
  Task CreateTwoFactorCodeAsync(Guid userId, string code, string ipAddress);
  Task<bool> VerifyTwoFactorCodeAsync(Guid userId, string code);
  Task CleanupExpiredCodesAsync();
  Task UpdateUserAsync(User user);
}