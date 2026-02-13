namespace AIWellness.Auth.Services.Abstractions;

public interface IPasswordValidator
{
  (bool IsValid, string? Error) ValidatePassword(string password);
}