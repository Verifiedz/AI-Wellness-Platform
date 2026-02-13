using Dapper;
using AIWellness.Auth.Models;

namespace AIWellness.Auth.Repositories;

public class UserRepository : IUserRepository
{
  private readonly IDbConnectionFactory _connectionFactory;

  public UserRepository(IDbConnectionFactory connectionFactory)
  {
    _connectionFactory = connectionFactory;
  }

  public async Task<User?> GetByEmailAsync(string email)
  {
    using var connection = _connectionFactory.CreateConnection();
    return await connection.QueryFirstOrDefaultAsync<User>(
        "SELECT * FROM get_user_by_email(@Email)",
        new { Email = email });
  }

  public async Task<User?> GetByUsernameAsync(string username)
  {
    using var connection = _connectionFactory.CreateConnection();
    return await connection.QueryFirstOrDefaultAsync<User>(
        "SELECT * FROM get_user_by_username(@Username)",
        new { Username = username });
  }

  public async Task<User?> GetByPhoneAsync(string phone)
  {
    using var connection = _connectionFactory.CreateConnection();
    return await connection.QueryFirstOrDefaultAsync<User>(
        "SELECT * FROM users WHERE phone = @Phone",
        new { Phone = phone });
  }

  public async Task<Guid> CreateAsync(User user)
  {
    using var connection = _connectionFactory.CreateConnection();
    var userId = await connection.ExecuteScalarAsync<Guid>(
        "SELECT create_user(@Id, @Username, @PasswordHash, @Email, @Phone, @IsActive, @IsEmailVerified)",
        user);
    return userId;
  }

  public async Task UpdateLastLoginAsync(Guid userId)
  {
    using var connection = _connectionFactory.CreateConnection();
    await connection.ExecuteAsync(
        "CALL update_user_last_login(@UserId)",
        new { UserId = userId });
  }

  public async Task IncrementFailedLoginAsync(Guid userId)
  {
    using var connection = _connectionFactory.CreateConnection();
    await connection.ExecuteAsync(
        "CALL increment_failed_login(@UserId)",
        new { UserId = userId });
  }

  public async Task LogLoginAttemptAsync(LoginAttempt attempt)
  {
    using var connection = _connectionFactory.CreateConnection();
    await connection.ExecuteAsync(
        "CALL log_login_attempt(@UserId, @IpAddress, @UserAgent, @IsSuccessful, @FailureReason)",
        attempt);
  }

  public async Task<bool> IsAccountLockedAsync(Guid userId)
  {
    using var connection = _connectionFactory.CreateConnection();
    return await connection.ExecuteScalarAsync<bool>(
        "SELECT is_account_locked(@UserId)",
        new { UserId = userId });
  }

  public async Task UpdatePasswordAsync(Guid userId, string newPasswordHash)
  {
    using var connection = _connectionFactory.CreateConnection();
    await connection.ExecuteAsync(
        "CALL update_user_password(@UserId, @NewPasswordHash)",
        new { UserId = userId, NewPasswordHash = newPasswordHash });
  }

  public async Task CreateVerificationCodeAsync(Guid userId, string code, string type, string ipAddress)
  {
    using var connection = _connectionFactory.CreateConnection();
    await connection.ExecuteAsync(
        "CALL create_verification_code(@UserId, @Code, @Type, @IpAddress)",
        new { UserId = userId, Code = code, Type = type, IpAddress = ipAddress });
  }

  public async Task<bool> VerifyCodeAsync(Guid userId, string code, string type)
  {
    using var connection = _connectionFactory.CreateConnection();
    return await connection.ExecuteScalarAsync<bool>(
        "SELECT verify_code(@UserId, @Code, @Type)",
        new { UserId = userId, Code = code, Type = type });
  }

  public async Task CreateTwoFactorCodeAsync(Guid userId, string code, string ipAddress)
  {
    using var connection = _connectionFactory.CreateConnection();
    // Clean up old 2FA codes
    await connection.ExecuteAsync(
        "DELETE FROM verificationcodes WHERE userid = @UserId AND type = '2fa'",
        new { UserId = userId });

    // Insert new 2FA code
    await connection.ExecuteAsync(
        @"INSERT INTO verificationcodes (userid, code, type, expiresat, ipaddress)
              VALUES (@UserId, @Code, '2fa', @ExpiresAt, @IpAddress)",
        new
        {
          UserId = userId,
          Code = code,
          ExpiresAt = DateTime.UtcNow.AddMinutes(5),
          IpAddress = ipAddress
        });
  }

  public async Task<bool> VerifyTwoFactorCodeAsync(Guid userId, string code)
  {
    using var connection = _connectionFactory.CreateConnection();
    var validCode = await connection.QueryFirstOrDefaultAsync<VerificationCode>(
        @"SELECT * FROM verificationcodes 
              WHERE userid = @UserId 
                AND code = @Code 
                AND type = '2fa'
                AND isused = false
                AND expiresat > @Now
              ORDER BY codecreated DESC 
              LIMIT 1",
        new
        {
          UserId = userId,
          Code = code,
          Now = DateTime.UtcNow
        });

    if (validCode == null)
      return false;

    // Mark as used
    await connection.ExecuteAsync(
        "UPDATE verificationcodes SET isused = true WHERE codeid = @CodeId",
        new { validCode.CodeId });

    return true;
  }

  public async Task CleanupExpiredCodesAsync()
  {
    using var connection = _connectionFactory.CreateConnection();
    await connection.ExecuteAsync("CALL cleanup_expired_codes()");
  }

  public async Task UpdateUserAsync(User user)
  {
    using var connection = _connectionFactory.CreateConnection();
    await connection.ExecuteAsync(@"
            UPDATE users 
            SET username = @Username,
                email = @Email,
                phone = @Phone,
                isactive = @IsActive,
                isemailverified = @IsEmailVerified,
                updatedat = @UpdatedAt,
                lastloginat = @LastLoginAt,
                failedloginattempts = @FailedLoginAttempts,
                lockeduntil = @LockedUntil
            WHERE id = @Id", user);
  }
}