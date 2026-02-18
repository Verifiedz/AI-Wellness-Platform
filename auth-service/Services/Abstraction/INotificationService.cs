namespace AIWellness.Auth.Services.Abstractions;

public interface INotificationService
{
  Task SendVerificationCodeAsync(Guid userId, string email, string code, string type);
}