using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AIWellness.Auth.Models;
using AIWellness.Auth.Services.Abstractions;
using Microsoft.IdentityModel.Tokens;

namespace AIWellness.Auth.Services;

public class JwtService : IJwtService
{
  private readonly IConfiguration _configuration;

  public JwtService(IConfiguration configuration)
  {
    _configuration = configuration;
  }

  public string GenerateJwtToken(User user)
  {
    var tokenHandler = new JwtSecurityTokenHandler();
    var jwtKey = _configuration["Jwt:Key"]
        ?? throw new InvalidOperationException("JWT Key is not configured");

    var key = Encoding.ASCII.GetBytes(jwtKey);
    var expiryInMinutes = GetJwtExpiryMinutes();

    var tokenDescriptor = new SecurityTokenDescriptor
    {
      Subject = new ClaimsIdentity(new[]
        {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("is_email_verified", user.IsEmailVerified.ToString())
            }),
      Expires = DateTime.UtcNow.AddMinutes(expiryInMinutes),
      Issuer = _configuration["Jwt:Issuer"],
      Audience = _configuration["Jwt:Audience"],
      SigningCredentials = new SigningCredentials(
            new SymmetricSecurityKey(key),
            SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
  }

  public string GenerateRefreshToken()
  {
    var randomNumber = new byte[32];
    using var rng = RandomNumberGenerator.Create();
    rng.GetBytes(randomNumber);
    return Convert.ToBase64String(randomNumber);
  }

  public int GetJwtExpiryMinutes()
  {
    if (!int.TryParse(_configuration["Jwt:ExpiryInMinutes"], out var expiryInMinutes))
      return 60;
    return expiryInMinutes;
  }
}