using AIWellness.Auth.DTOs.Requests;
using AIWellness.Auth.DTOs.Responses;
using AIWellness.Auth.Exceptions;
using AIWellness.Auth.Models;
using AIWellness.Auth.Repositories;
using AIWellness.Auth.Services.Abstractions;
using System.Security.Claims;
using System.Security.Cryptography;

namespace AIWellness.Auth.Services;

public class AuthService : IAuthService
{
  private readonly IUserRepository _userRepository;
  private readonly IPasswordValidator _passwordValidator;
  private readonly IPasswordHasher _passwordHasher;
  private readonly INotificationService _notificationService;
  private readonly IJwtService _jwtService;
  private readonly IHttpContextAccessor _httpContextAccessor;
  private readonly IConfiguration _configuration;
  private readonly IUserDataDeletionClient _userDataDeletionClient;
  private readonly ISecurityAuditService _securityAudit;
  private readonly ILogger<AuthService> _logger;

  public AuthService(
      IUserRepository userRepository,
      IPasswordValidator passwordValidator,
      IPasswordHasher passwordHasher,
      INotificationService notificationService,
      IJwtService jwtService,
      IHttpContextAccessor httpContextAccessor,
      IConfiguration configuration,
      IUserDataDeletionClient userDataDeletionClient,
      ISecurityAuditService securityAudit,
      ILogger<AuthService> logger)
  {
    _userRepository = userRepository;
    _passwordValidator = passwordValidator;
    _passwordHasher = passwordHasher;
    _notificationService = notificationService;
    _jwtService = jwtService;
    _httpContextAccessor = httpContextAccessor;
    _configuration = configuration;
    _userDataDeletionClient = userDataDeletionClient;
    _securityAudit = securityAudit;
    _logger = logger;
  }

  public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
  {
    var (isValid, error) = _passwordValidator.ValidatePassword(request.Password);
    if (!isValid)
      throw new AuthValidationException("PASSWORD_POLICY", $"Password validation failed: {error}");

    var existingEmail = await _userRepository.GetByEmailAsync(request.Email);
    if (existingEmail != null)
      throw new AuthConflictException("EMAIL_EXISTS", "Email already registered");

    var existingUsername = await _userRepository.GetByUsernameAsync(request.Username);
    if (existingUsername != null)
      throw new AuthConflictException("USERNAME_EXISTS", "Username already taken");

    if (!string.IsNullOrEmpty(request.Phone))
    {
      var existingPhone = await _userRepository.GetByPhoneAsync(request.Phone);
      if (existingPhone != null)
        throw new AuthConflictException("PHONE_EXISTS", "Phone number already registered");
    }

    var user = new User
    {
      Id = Guid.NewGuid(),
      Username = request.Username,
      Email = request.Email,
      Phone = request.Phone,
      PasswordHash = _passwordHasher.HashPassword(request.Password),
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

    await _notificationService.SendVerificationCodeAsync(user.Id, user.Email, verificationCode, "email_verify", user.Phone);
    await _securityAudit.LogAsync(SecurityAuditEventType.Register, user.Id,
        details: new { email = user.Email, username = user.Username });
    await _securityAudit.LogAsync(SecurityAuditEventType.EmailVerificationSent, user.Id,
        details: new { channel = "email" });

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
      await _securityAudit.LogAsync(SecurityAuditEventType.LoginFailure, userId: null,
          outcome: SecurityAuditOutcome.Failure,
          details: new { reason = "user_not_found", email = request.Email });
      throw new AuthSecurityException("INVALID_CREDENTIALS", "Invalid credentials - user not found");
    }

    if (!user.IsActive)
    {
      await _securityAudit.LogAsync(SecurityAuditEventType.LoginBlocked, user.Id,
          outcome: SecurityAuditOutcome.Blocked,
          details: new { reason = "account_deactivated" });
      throw new AuthSecurityException("ACCOUNT_DEACTIVATED", "Account is deactivated");
    }

    var isLocked = await _userRepository.IsAccountLockedAsync(user.Id);
    if (isLocked)
    {
      await _securityAudit.LogAsync(SecurityAuditEventType.LoginBlocked, user.Id,
          outcome: SecurityAuditOutcome.Blocked,
          details: new { reason = "account_locked" });
      throw new AuthSecurityException("ACCOUNT_LOCKED", "Account temporarily locked due to failed attempts");
    }

    var passwordValid = _passwordHasher.VerifyHashedPassword(user.PasswordHash, request.Password);

    var ipAddress = GetClientIpAddress();
    var userAgent = _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString() ?? "";

    if (!passwordValid)
    {
      await _userRepository.IncrementFailedLoginAsync(user.Id);
      await LogFailedLoginAttempt(user.Id, "Invalid password", ipAddress, userAgent);
      await _securityAudit.LogAsync(SecurityAuditEventType.LoginFailure, user.Id,
          outcome: SecurityAuditOutcome.Failure,
          details: new { reason = "invalid_password" });
      throw new AuthSecurityException("INVALID_CREDENTIALS", "Invalid credentials - wrong password");
    }

    if (!user.IsEmailVerified)
    {
      await _securityAudit.LogAsync(SecurityAuditEventType.LoginBlocked, user.Id,
          outcome: SecurityAuditOutcome.Blocked,
          details: new { reason = "email_not_verified" });
      throw new AuthSecurityException("EMAIL_NOT_VERIFIED", "Email not verified");
    }

    var twoFactorCode = GenerateRandomCode();
    await _userRepository.CreateTwoFactorCodeAsync(user.Id, twoFactorCode, ipAddress);

    await _notificationService.SendVerificationCodeAsync(user.Id, user.Email, twoFactorCode, "2fa", user.Phone);

    await _userRepository.UpdateLastLoginAsync(user.Id);
    await LogSuccessfulLoginAttempt(user.Id, ipAddress, userAgent);
    await _securityAudit.LogAsync(SecurityAuditEventType.LoginSuccess, user.Id,
        details: new { stage = "password_verified_2fa_pending" });
    await _securityAudit.LogAsync(SecurityAuditEventType.TwoFactorCodeSent, user.Id);

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
      throw new AuthNotFoundException("USER_NOT_FOUND", "User not found for 2FA verification");

    var isValid = await _userRepository.VerifyTwoFactorCodeAsync(user.Id, request.Code);
    if (!isValid)
    {
      await _securityAudit.LogAsync(SecurityAuditEventType.TwoFactorCodeFailed, user.Id,
          outcome: SecurityAuditOutcome.Failure);
      throw new AuthSecurityException("INVALID_2FA_CODE", "Invalid or expired 2FA code");
    }

    var token = _jwtService.GenerateJwtToken(user);
    var refreshToken = _jwtService.GenerateRefreshToken();

    var tokenHash = HashToken(refreshToken);
    await _userRepository.StoreRefreshTokenAsync(user.Id, tokenHash, DateTime.UtcNow.AddDays(7));

    await _securityAudit.LogAsync(SecurityAuditEventType.TwoFactorCodeVerified, user.Id);

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
      throw new AuthNotFoundException("USER_NOT_FOUND", "User not found for email verification");

    if (user.IsEmailVerified)
      throw new AuthValidationException("EMAIL_ALREADY_VERIFIED", "Email already verified");

    var isValid = await _userRepository.VerifyCodeAsync(user.Id, code, "email_verify");
    if (!isValid)
    {
      await _securityAudit.LogAsync(SecurityAuditEventType.EmailVerified, user.Id,
          outcome: SecurityAuditOutcome.Failure);
      throw new AuthSecurityException("INVALID_VERIFICATION_CODE", "Invalid or expired verification code");
    }

    await _securityAudit.LogAsync(SecurityAuditEventType.EmailVerified, user.Id);
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
      throw new AuthNotFoundException("USER_NOT_FOUND", "User not found for resend verification");

    if (user.IsEmailVerified)
      throw new AuthValidationException("EMAIL_ALREADY_VERIFIED", "Email already verified");

    var verificationCode = GenerateRandomCode();
    var ipAddress = GetClientIpAddress();

    await _userRepository.CreateVerificationCodeAsync(user.Id, verificationCode, "email_verify", ipAddress);
    await _notificationService.SendVerificationCodeAsync(user.Id, user.Email, verificationCode, "email_verify", user.Phone);
    await _securityAudit.LogAsync(SecurityAuditEventType.EmailVerificationSent, user.Id,
        details: new { trigger = "resend" });
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
      // Deliberately log with no user id so we can still spot reset-scanning
      // attacks on non-existent emails without confirming account existence.
      await _securityAudit.LogAsync(SecurityAuditEventType.PasswordResetRequested, userId: null,
          outcome: SecurityAuditOutcome.Failure,
          details: new { reason = "user_not_found" });
      _logger.LogWarning("Password reset requested for non-existent user/email");
      return;
    }

    var resetCode = GenerateRandomCode();
    var ipAddress = GetClientIpAddress();

    await _userRepository.CreateVerificationCodeAsync(user.Id, resetCode, "password_reset", ipAddress);
    await _notificationService.SendVerificationCodeAsync(user.Id, user.Email, resetCode, "password_reset", user.Phone);
    await _securityAudit.LogAsync(SecurityAuditEventType.PasswordResetRequested, user.Id);
  }

  public async Task ResetPasswordAsync(ResetPasswordRequest request)
  {
    if (request.NewPassword != request.NewPassword2)
      throw new AuthValidationException("PASSWORDS_DO_NOT_MATCH", "New passwords do not match");

    var (isValid, error) = _passwordValidator.ValidatePassword(request.NewPassword);
    if (!isValid)
      throw new AuthValidationException("PASSWORD_POLICY", $"Password validation failed: {error}");

    var user = await _userRepository.GetByEmailAsync(request.Email);
    if (user == null)
      throw new AuthNotFoundException("USER_NOT_FOUND", "User not found for password reset");

    if (_passwordHasher.VerifyHashedPassword(user.PasswordHash, request.NewPassword))
      throw new AuthValidationException("SAME_PASSWORD", "New password must differ from current");

    var isValidCode = await _userRepository.VerifyCodeAsync(user.Id, request.Code, "password_reset");
    if (!isValidCode)
    {
      await _securityAudit.LogAsync(SecurityAuditEventType.PasswordResetCompleted, user.Id,
          outcome: SecurityAuditOutcome.Failure,
          details: new { reason = "invalid_reset_code" });
      throw new AuthSecurityException("INVALID_RESET_CODE", "Invalid or expired reset code");
    }

    var newPasswordHash = _passwordHasher.HashPassword(request.NewPassword);
    await _userRepository.UpdatePasswordAsync(user.Id, newPasswordHash);
    await _securityAudit.LogAsync(SecurityAuditEventType.PasswordResetCompleted, user.Id);
  }

  public async Task ChangePasswordAsync(ChangePasswordRequest request)
  {
    if (request.NewPassword != request.NewPassword2)
      throw new AuthValidationException("PASSWORDS_DO_NOT_MATCH", "New passwords do not match");

    var (isValid, error) = _passwordValidator.ValidatePassword(request.NewPassword);
    if (!isValid)
      throw new AuthValidationException("PASSWORD_POLICY", $"Password validation failed: {error}");

    var user = await _userRepository.GetByEmailAsync(request.Email);
    if (user == null)
      throw new AuthNotFoundException("USER_NOT_FOUND", "User not found for password change");

    if (!_passwordHasher.VerifyHashedPassword(user.PasswordHash, request.CurrentPassword))
    {
      await _securityAudit.LogAsync(SecurityAuditEventType.PasswordChanged, user.Id,
          outcome: SecurityAuditOutcome.Failure,
          details: new { reason = "wrong_current_password" });
      throw new AuthSecurityException("WRONG_CURRENT_PASSWORD", "Current password is incorrect");
    }

    if (_passwordHasher.VerifyHashedPassword(user.PasswordHash, request.NewPassword))
      throw new AuthValidationException("SAME_PASSWORD", "New password must differ from current");

    var newPasswordHash = _passwordHasher.HashPassword(request.NewPassword);
    await _userRepository.UpdatePasswordAsync(user.Id, newPasswordHash);
    await _securityAudit.LogAsync(SecurityAuditEventType.PasswordChanged, user.Id);
  }

  public async Task<UserInfoResponse> GetUserInfoAsync(string email)
  {
    var user = await _userRepository.GetByEmailAsync(email);
    if (user == null)
      throw new AuthNotFoundException("USER_NOT_FOUND", "User not found for user info");

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

  public async Task<TwoFactorResponse> RefreshTokenAsync(string refreshToken)
  {
    var tokenHash = HashToken(refreshToken);
    var tokenRecord = await _userRepository.GetRefreshTokenAsync(tokenHash);

    if (tokenRecord == null)
      throw new AuthSecurityException("INVALID_REFRESH_TOKEN", "Refresh token not found");

    if (tokenRecord.Value.IsRevoked)
      throw new AuthSecurityException("REFRESH_TOKEN_REVOKED", "Refresh token has been revoked");

    if (tokenRecord.Value.ExpiresAt < DateTime.UtcNow)
      throw new AuthSecurityException("REFRESH_TOKEN_EXPIRED", "Refresh token has expired");

    var user = await _userRepository.GetByIdAsync(tokenRecord.Value.UserId);
    if (user == null)
      throw new AuthNotFoundException("USER_NOT_FOUND", "User not found for refresh token");

    var newJwt = _jwtService.GenerateJwtToken(user);
    var newRefreshToken = _jwtService.GenerateRefreshToken();
    var newTokenHash = HashToken(newRefreshToken);

    await _userRepository.RevokeRefreshTokenAsync(tokenHash, newTokenHash);
    await _userRepository.StoreRefreshTokenAsync(user.Id, newTokenHash, DateTime.UtcNow.AddDays(7));
    await _securityAudit.LogAsync(SecurityAuditEventType.TokenRefreshed, user.Id);

    return new TwoFactorResponse
    {
      Token = newJwt,
      RefreshToken = newRefreshToken,
      ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtService.GetJwtExpiryMinutes())
    };
  }

  public async Task DeleteAccountAsync(Guid userId, string password)
  {
    var user = await _userRepository.GetByIdAsync(userId);
    if (user == null)
      throw new AuthNotFoundException("USER_NOT_FOUND", "User not found for account deletion");

    if (!_passwordHasher.VerifyHashedPassword(user.PasswordHash, password))
    {
      _logger.LogWarning("Account deletion failed password re-auth for {UserId}", userId);
      await _securityAudit.LogAsync(SecurityAuditEventType.AccountDeleted, userId,
          outcome: SecurityAuditOutcome.Failure,
          details: new { reason = "wrong_password" });
      throw new AuthSecurityException("WRONG_PASSWORD", "Password re-authentication failed");
    }

    // Best-effort cascade to downstream services. Per Apple Guideline 5.1.1(v)
    // the auth record itself is what must be removable; downstream orphans are
    // cleaned up eventually and logged here for manual reconciliation.
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20));
    var cascade = await _userDataDeletionClient.DeleteAllUserDataAsync(userId, cts.Token);
    if (cascade.Errors.Count > 0)
    {
      _logger.LogWarning(
          "Cascade deletion for user {UserId} had {ErrorCount} errors: {Errors}",
          userId, cascade.Errors.Count, string.Join("; ", cascade.Errors));
    }

    // Log the deletion BEFORE we drop the user row. security_audit_log.user_id
    // is ON DELETE SET NULL, so a post-delete audit would lose the linkage; by
    // inserting here we retain "user X was deleted at time T from IP Y" in a
    // way that survives GDPR erasure of the primary row.
    await _securityAudit.LogAsync(SecurityAuditEventType.AccountDeleted, userId,
        details: new
        {
            cascade_errors = cascade.Errors.Count,
            cascade_error_list = cascade.Errors
        });

    await _userRepository.DeleteUserAsync(userId);
    _logger.LogInformation("User {UserId} account deleted", userId);
  }

  private static string GenerateRandomCode()
  {
    return RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
  }

  private static string HashToken(string token) =>
      Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token))).ToLowerInvariant();

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