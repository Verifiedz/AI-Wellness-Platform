using AIWellness.Auth.DTOs.Requests;
using AIWellness.Auth.DTOs.Responses;
using AIWellness.Auth.Models;
using AIWellness.Auth.Repositories;
using AIWellness.Auth.Services.Abstractions;
using System.Security.Claims;

namespace AIWellness.Auth.Services;

public class AuthService : IAuthService
{
  private readonly IUserRepository _userRepository;
  private readonly IPasswordValidator _passwordValidator;
  private readonly IEmailService _emailService;
  private readonly INotificationService _notificationService;
  private readonly IJwtService _jwtService;
  private readonly IHttpContextAccessor _httpContextAccessor;
  private readonly IConfiguration _configuration;
  private readonly ILogger<AuthService> _logger;

  public AuthService(
      IUserRepository userRepository,
      IPasswordValidator passwordValidator,
      IEmailService emailService,
      INotificationService notificationService,
      IJwtService jwtService,
      IHttpContextAccessor httpContextAccessor,
      IConfiguration configuration,
      ILogger<AuthService> logger)
  {
    _userRepository = userRepository;
    _passwordValidator = passwordValidator;
    _emailService = emailService;
    _notificationService = notificationService;
    _jwtService = jwtService;
    _httpContextAccessor = httpContextAccessor;
    _configuration = configuration;
    _logger = logger;
  }

  public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
  {
    var (isValid, error) = _passwordValidator.ValidatePassword(request.Password);
    if (!isValid)
      throw new Exception($"Password validation failed: {error}");

    var existingEmail = await _userRepository.GetByEmailAsync(request.Email);
    if (existingEmail != null)
      throw new Exception("Email already registered");

    var existingUsername = await _userRepository.GetByUsernameAsync(request.Username);
    if (existingUsername != null)
      throw new Exception("Username already taken");

    if (!string.IsNullOrEmpty(request.Phone))
    {
      var existingPhone = await _userRepository.GetByPhoneAsync(request.Phone);
      if (existingPhone != null)
        throw new Exception("Phone number already registered");
    }

    var user = new User
    {
      Id = Guid.NewGuid(),
      Username = request.Username,
      Email = request.Email,
      Phone = request.Phone,
      PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
      IsActive = true,
      IsEmailVerified = false,
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow,
      FailedLoginAttempts = 0
    };

    await _userRepository.CreateAsync(user);

    var verificationCode = GenerateRandomCode();
    var ipAddress = GetClientIpAddress();
    await _userRepository.CreateVerificationCodeAsync(user.Id, verificationCode, "email_verify", ipAddress);

    await _emailService.SendVerificationEmailAsync(user.Email, verificationCode);
    await _notificationService.SendVerificationCodeAsync(user.Id, user.Email, verificationCode, "email_verify");

    var token = _jwtService.GenerateJwtToken(user);

    return new RegisterResponse
    {
      Token = token,
      RequiresEmailVerification = true,
      Message = "Registration successful. Please check your email for verification code."
    };
  }

  public async Task<LoginResponse> LoginAsync(LoginRequest request)
  {
    var user = await _userRepository.GetByEmailAsync(request.Email);
    if (user == null)
    {
      await LogFailedLoginAttempt(null, "Invalid credentials");
      throw new Exception("Invalid credentials");
    }

    if (!user.IsActive)
      throw new Exception("Account is deactivated");

    var isLocked = await _userRepository.IsAccountLockedAsync(user.Id);
    if (isLocked)
      throw new Exception("Account is temporarily locked due to too many failed login attempts. Please try again later.");

    var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

    var ipAddress = GetClientIpAddress();
    var userAgent = _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString() ?? "";

    if (!passwordValid)
    {
      await _userRepository.IncrementFailedLoginAsync(user.Id);
      await LogFailedLoginAttempt(user.Id, "Invalid password", ipAddress, userAgent);
      throw new Exception("Invalid credentials");
    }

    if (!user.IsEmailVerified)
      throw new Exception("Email not verified. Please verify your email first.");

    var twoFactorCode = GenerateRandomCode();
    await _userRepository.CreateTwoFactorCodeAsync(user.Id, twoFactorCode, ipAddress);

    _logger.LogInformation($"2FA Code for {user.Email}: {twoFactorCode}");
    await _notificationService.SendVerificationCodeAsync(user.Id, user.Email, twoFactorCode, "2fa");

    await _userRepository.UpdateLastLoginAsync(user.Id);
    await LogSuccessfulLoginAttempt(user.Id, ipAddress, userAgent);

    return new LoginResponse
    {
      RequiresTwoFactor = true,
      Message = "2FA code sent to your notification device.",
      TwoFactorExpiresAt = DateTime.UtcNow.AddMinutes(5)
    };
  }

  public async Task<TwoFactorResponse> VerifyTwoFactorAsync(TwoFactorRequest request)
  {
    var user = await _userRepository.GetByEmailAsync(request.Email);
    if (user == null)
      throw new Exception("User not found");

    var isValid = await _userRepository.VerifyTwoFactorCodeAsync(user.Id, request.Code);
    if (!isValid)
      throw new Exception("Invalid or expired 2FA code");

    var token = _jwtService.GenerateJwtToken(user);
    var refreshToken = _jwtService.GenerateRefreshToken();

    return new TwoFactorResponse
    {
      Token = token,
      RefreshToken = refreshToken,
      ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtService.GetJwtExpiryMinutes())
    };
  }

  public async Task<bool> VerifyEmailAsync(string email, string code)
  {
    var user = await _userRepository.GetByEmailAsync(email);
    if (user == null)
      throw new Exception("User not found");

    if (user.IsEmailVerified)
      throw new Exception("Email already verified");

    var isValid = await _userRepository.VerifyCodeAsync(user.Id, code, "email_verify");
    if (!isValid)
      throw new Exception("Invalid or expired verification code");

    return true;
  }

  public async Task ResendVerificationEmailAsync(ResendVerificationRequest request)
  {
    User? user = null;

    if (!string.IsNullOrEmpty(request.Email))
      user = await _userRepository.GetByEmailAsync(request.Email);
    else if (!string.IsNullOrEmpty(request.Username))
      user = await _userRepository.GetByUsernameAsync(request.Username);

    if (user == null)
      throw new Exception("User not found");

    if (user.IsEmailVerified)
      throw new Exception("Email already verified");

    var verificationCode = GenerateRandomCode();
    var ipAddress = GetClientIpAddress();

    await _userRepository.CreateVerificationCodeAsync(user.Id, verificationCode, "email_verify", ipAddress);
    await _emailService.SendVerificationEmailAsync(user.Email, verificationCode);
    await _notificationService.SendVerificationCodeAsync(user.Id, user.Email, verificationCode, "email_verify");
  }

  public async Task InitiatePasswordResetAsync(ForgotPasswordRequest request)
  {
    User? user = null;

    if (!string.IsNullOrEmpty(request.Email))
      user = await _userRepository.GetByEmailAsync(request.Email);
    else if (!string.IsNullOrEmpty(request.Username))
      user = await _userRepository.GetByUsernameAsync(request.Username);

    if (user == null)
    {
      _logger.LogWarning($"Password reset requested for non-existent user/email");
      return;
    }

    var resetCode = GenerateRandomCode();
    var ipAddress = GetClientIpAddress();

    await _userRepository.CreateVerificationCodeAsync(user.Id, resetCode, "password_reset", ipAddress);
    await _emailService.SendPasswordResetEmailAsync(user.Email, resetCode);
    await _notificationService.SendVerificationCodeAsync(user.Id, user.Email, resetCode, "password_reset");
  }

  public async Task ResetPasswordAsync(ResetPasswordRequest request)
  {
    if (request.NewPassword != request.NewPassword2)
      throw new Exception("New passwords do not match");

    var (isValid, error) = _passwordValidator.ValidatePassword(request.NewPassword);
    if (!isValid)
      throw new Exception($"Password validation failed: {error}");

    var user = await _userRepository.GetByEmailAsync(request.Email);
    if (user == null)
      throw new Exception("User not found");

    if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
      throw new Exception("Please choose a new password different from your current one");

    var isValidCode = await _userRepository.VerifyCodeAsync(user.Id, request.Code, "password_reset");
    if (!isValidCode)
      throw new Exception("Invalid or expired reset code");

    var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
    await _userRepository.UpdatePasswordAsync(user.Id, newPasswordHash);
  }

  public async Task ChangePasswordAsync(ChangePasswordRequest request)
  {
    if (request.NewPassword != request.NewPassword2)
      throw new Exception("New passwords do not match");

    var (isValid, error) = _passwordValidator.ValidatePassword(request.NewPassword);
    if (!isValid)
      throw new Exception($"Password validation failed: {error}");

    var user = await _userRepository.GetByEmailAsync(request.Email);
    if (user == null)
      throw new Exception("User not found");

    if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
      throw new Exception("Current password is incorrect");

    if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
      throw new Exception("Please choose a new password different from your current one");

    var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
    await _userRepository.UpdatePasswordAsync(user.Id, newPasswordHash);
  }

  public async Task<UserInfoResponse> GetUserInfoAsync(string email)
  {
    var user = await _userRepository.GetByEmailAsync(email);
    if (user == null)
      throw new Exception("User not found");

    var isLocked = await _userRepository.IsAccountLockedAsync(user.Id);

    return new UserInfoResponse
    {
      UserId = user.Id,
      Username = user.Username,
      Email = user.Email,
      Phone = user.Phone,
      IsEmailVerified = user.IsEmailVerified,
      CreatedAt = user.CreatedAt,
      LastLoginAt = user.LastLoginAt,
      FailedLoginAttempts = user.FailedLoginAttempts,
      IsAccountLocked = isLocked,
      LockedUntil = user.LockedUntil
    };
  }

  private string GenerateRandomCode()
  {
    var random = new Random();
    return random.Next(100000, 999999).ToString();
  }

  private async Task LogSuccessfulLoginAttempt(Guid userId, string ipAddress, string userAgent)
  {
    var attempt = new LoginAttempt
    {
      Id = Guid.NewGuid(),
      UserId = userId,
      IpAddress = ipAddress,
      UserAgent = userAgent,
      IsSuccessful = true,
      AttemptedAt = DateTime.UtcNow
    };
    await _userRepository.LogLoginAttemptAsync(attempt);
  }

  private async Task LogFailedLoginAttempt(Guid? userId, string reason, string ipAddress = "", string userAgent = "")
  {
    if (string.IsNullOrEmpty(ipAddress))
      ipAddress = GetClientIpAddress();

    var attempt = new LoginAttempt
    {
      Id = Guid.NewGuid(),
      UserId = userId,
      IpAddress = ipAddress,
      UserAgent = userAgent,
      IsSuccessful = false,
      FailureReason = reason,
      AttemptedAt = DateTime.UtcNow
    };
    await _userRepository.LogLoginAttemptAsync(attempt);
  }

  private string GetClientIpAddress()
  {
    var httpContext = _httpContextAccessor.HttpContext;
    if (httpContext == null) return "127.0.0.1";

    var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

    if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
    {
      var forwardedIp = forwardedFor.FirstOrDefault();
      if (!string.IsNullOrEmpty(forwardedIp))
        ipAddress = forwardedIp.Split(',').First().Trim();
    }

    return ipAddress;
  }
}