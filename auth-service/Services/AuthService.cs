// Services/AuthService.cs
using AIWellness.Auth.DTOs;
using AIWellness.Auth.Models;
using AIWellness.Auth.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AIWellness.Auth.Services
{
  public class AuthService : IAuthService
  {
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
      _userRepository = userRepository;
      _configuration = configuration;
    }

    public async Task<string> RegisterAsync(RegisterRequest request)
    {
      // Check if email exists
      var existingEmail = await _userRepository.GetByEmailAsync(request.Email);
      if (existingEmail != null)
        throw new Exception("Email already registered");

      // Check if username exists
      var existingUsername = await _userRepository.GetByUsernameAsync(request.Username);
      if (existingUsername != null)
        throw new Exception("Username already taken");

      // Check if phone exists (if provided)
      if (!string.IsNullOrEmpty(request.Phone))
      {
        var existingPhone = await _userRepository.GetByPhoneAsync(request.Phone);
        if (existingPhone != null)
          throw new Exception("Phone number already registered");
      }

      // Create new user
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
        UpdatedAt = DateTime.UtcNow
      };

      await _userRepository.CreateAsync(user);

      return GenerateJwtToken(user);
    }

    public async Task<string> LoginAsync(LoginRequest request)
    {
      // Find user by email
      var user = await _userRepository.GetByEmailAsync(request.Email);

      // Check if user exists
      if (user == null)
        throw new Exception("Invalid credentials");

      // Verify password
      if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        throw new Exception("Invalid credentials");

      // Check if account is active
      if (!user.IsActive)
        throw new Exception("Account is deactivated");

      // Update last login
      user.LastLoginAt = DateTime.UtcNow;
      await _userRepository.UpdateAsync(user);

      return GenerateJwtToken(user);
    }

    private string GenerateJwtToken(User user)
    {
      var tokenHandler = new JwtSecurityTokenHandler();

      // Get JWT key with null check
      var jwtKey = _configuration["Jwt:Key"]
          ?? throw new InvalidOperationException("JWT Key is not configured in appsettings.json");

      var key = Encoding.ASCII.GetBytes(jwtKey);

      // Get JWT expiry with null check
      var expiryInMinutesString = _configuration["Jwt:ExpiryInMinutes"]
          ?? throw new InvalidOperationException("JWT ExpiryInMinutes is not configured in appsettings.json");

      if (!double.TryParse(expiryInMinutesString, out var expiryInMinutes))
        throw new InvalidOperationException("JWT ExpiryInMinutes must be a valid number");

      // Get issuer and audience with null checks
      var issuer = _configuration["Jwt:Issuer"]
          ?? throw new InvalidOperationException("JWT Issuer is not configured in appsettings.json");

      var audience = _configuration["Jwt:Audience"]
          ?? throw new InvalidOperationException("JWT Audience is not configured in appsettings.json");

      var tokenDescriptor = new SecurityTokenDescriptor
      {
        Subject = new ClaimsIdentity(new[]
          {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Username)
                }),
        Expires = DateTime.UtcNow.AddMinutes(expiryInMinutes),
        Issuer = issuer,
        Audience = audience,
        SigningCredentials = new SigningCredentials(
              new SymmetricSecurityKey(key),
              SecurityAlgorithms.HmacSha256Signature)
      };

      var token = tokenHandler.CreateToken(tokenDescriptor);
      return tokenHandler.WriteToken(token);
    }
  }
}