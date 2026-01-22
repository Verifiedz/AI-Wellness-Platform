// Services/IAuthService.cs
using AIWellness.Auth.DTOs;

namespace AIWellness.Auth.Services
{
  public interface IAuthService
  {
    Task<string> RegisterAsync(RegisterRequest request);
    Task<string> LoginAsync(LoginRequest request);
  }
}