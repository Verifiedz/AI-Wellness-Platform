using AIWellness.Auth.Models;

namespace AIWellness.Auth.Services.Abstractions;

public interface IJwtService
{
  string GenerateJwtToken(User user);
  string GenerateRefreshToken();
  int GetJwtExpiryMinutes();
}