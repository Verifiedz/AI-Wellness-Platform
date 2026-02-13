using AIWellness.Auth.DTOs.Requests;
using AIWellness.Auth.DTOs.Responses;

namespace AIWellness.Auth.Services.Abstractions;

public interface IAuthService
{
  Task<RegisterResponse> RegisterAsync(RegisterRequest request);
  Task<LoginResponse> LoginAsync(LoginRequest request);
  Task<TwoFactorResponse> VerifyTwoFactorAsync(TwoFactorRequest request);
  Task<bool> VerifyEmailAsync(string email, string code);
  Task ResendVerificationEmailAsync(ResendVerificationRequest request);
  Task InitiatePasswordResetAsync(ForgotPasswordRequest request);
  Task ResetPasswordAsync(ResetPasswordRequest request);
  Task ChangePasswordAsync(ChangePasswordRequest request);
  Task<UserInfoResponse> GetUserInfoAsync(string email);
}