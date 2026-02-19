using AIWellness.Auth.Services.Abstractions;

namespace AIWellness.Auth.Services;

public class PasswordValidator : IPasswordValidator
{
  private readonly IConfiguration _configuration;

  public PasswordValidator(IConfiguration configuration)
  {
    _configuration = configuration;
  }

  public (bool IsValid, string? Error) ValidatePassword(string password)
  {
    var minLength = _configuration.GetValue<int>("PasswordPolicy:MinLength", 8);
    var requireUppercase = _configuration.GetValue<bool>("PasswordPolicy:RequireUppercase", true);
    var requireLowercase = _configuration.GetValue<bool>("PasswordPolicy:RequireLowercase", true);
    var requireDigit = _configuration.GetValue<bool>("PasswordPolicy:RequireDigit", true);
    var requireSpecialChar = _configuration.GetValue<bool>("PasswordPolicy:RequireSpecialChar", true);

    if (password.Length < minLength)
      return (false, $"Password must be at least {minLength} characters long");

    if (requireUppercase && !password.Any(char.IsUpper))
      return (false, "Password must contain at least one uppercase letter");

    if (requireLowercase && !password.Any(char.IsLower))
      return (false, "Password must contain at least one lowercase letter");

    if (requireDigit && !password.Any(char.IsDigit))
      return (false, "Password must contain at least one digit");

    if (requireSpecialChar && !password.Any(ch => !char.IsLetterOrDigit(ch)))
      return (false, "Password must contain at least one special character");

    return (true, null);
  }
}