using AIWellness.Auth.Services.Abstractions;

namespace AIWellness.Auth.Services;

public class EmailService : IEmailService
{
  private readonly ILogger<EmailService> _logger;

  public EmailService(ILogger<EmailService> logger)
  {
    _logger = logger;
  }

  public Task SendVerificationEmailAsync(string email, string verificationCode)
  {
    _logger.LogInformation($"Verification email to {email}: Code = {verificationCode}");
    return Task.CompletedTask;
  }

  public Task SendPasswordResetEmailAsync(string email, string resetCode)
  {
    _logger.LogInformation($"Password reset email to {email}: Code = {resetCode}");
    return Task.CompletedTask;
  }
}