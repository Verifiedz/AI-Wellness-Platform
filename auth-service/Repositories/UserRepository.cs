// Repositories/UserRepository.cs
using Dapper;
using System.Data;
using AIWellness.Auth.Models;

namespace AIWellness.Auth.Repositories
{
  public interface IUserRepository
  {
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByPhoneAsync(string phone);
    Task<Guid> CreateAsync(User user);
    Task UpdateAsync(User user);
  }

  public class UserRepository : IUserRepository
  {
    private readonly IConfiguration _configuration;

    public UserRepository(IConfiguration configuration)
    {
      _configuration = configuration;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
      using var connection = DbConnection.GetConnection(_configuration);
      return await connection.QueryFirstOrDefaultAsync<User>(
          @"SELECT * FROM ""Users"" WHERE ""Email"" = @Email",
          new { Email = email }
      );
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
      using var connection = DbConnection.GetConnection(_configuration);
      return await connection.QueryFirstOrDefaultAsync<User>(
          @"SELECT * FROM ""Users"" WHERE ""Username"" = @Username",
          new { Username = username }
      );
    }

    public async Task<User?> GetByPhoneAsync(string phone)
    {
      using var connection = DbConnection.GetConnection(_configuration);
      return await connection.QueryFirstOrDefaultAsync<User>(
          @"SELECT * FROM ""Users"" WHERE ""Phone"" = @Phone",
          new { Phone = phone }
      );
    }

    public async Task<Guid> CreateAsync(User user)
    {
      using var connection = DbConnection.GetConnection(_configuration);
      var sql = @"
                INSERT INTO ""Users"" 
                (""Id"", ""Username"", ""PasswordHash"", ""Email"", ""Phone"", 
                 ""IsActive"", ""IsEmailVerified"", ""CreatedAt"", ""UpdatedAt"")
                VALUES (@Id, @Username, @PasswordHash, @Email, @Phone, 
                        @IsActive, @IsEmailVerified, @CreatedAt, @UpdatedAt)
                RETURNING ""Id""";

      return await connection.ExecuteScalarAsync<Guid>(sql, user);
    }

    public async Task UpdateAsync(User user)
    {
      using var connection = DbConnection.GetConnection(_configuration);
      var sql = @"
                UPDATE ""Users"" 
                SET ""Username"" = @Username,
                    ""PasswordHash"" = @PasswordHash,
                    ""Email"" = @Email,
                    ""Phone"" = @Phone,
                    ""IsActive"" = @IsActive,
                    ""IsEmailVerified"" = @IsEmailVerified,
                    ""UpdatedAt"" = @UpdatedAt,
                    ""LastLoginAt"" = @LastLoginAt,
                    ""FailedLoginAttempts"" = @FailedLoginAttempts,
                    ""LockedUntil"" = @LockedUntil
                WHERE ""Id"" = @Id";

      await connection.ExecuteAsync(sql, user);
    }
  }
}