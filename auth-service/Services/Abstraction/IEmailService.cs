namespace AIWellness.Auth.Services.Abstractions;

public interface IEmailService
{
  Task SendVerificationEmailAsync(string email, string verificationCode);
  Task SendPasswordResetEmailAsync(string email, string resetCode);
}