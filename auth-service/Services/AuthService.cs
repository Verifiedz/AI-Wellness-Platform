using AIWellness.Auth.Data;
using AIWellness.Auth.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AIWellness.Auth.Services
{
  public class AuthServiceImpl : IAuthService
  {
    private readonly AuthDbContext _context;
    private readonly IConfiguration _config;

    public AuthServiceImpl(AuthDbContext context, IConfiguration config)
    {
      _context = context;
      _config = config;
    }

    public async Task<bool> RegisterUser(string email, string password)
    {
      if (await _context.Users.AnyAsync(u => u.Email == email))
      {
        return false;
      }

      string passwordHash = BCrypt.Net.BCrypt.HashPassword(password);
      var newUser = new User { Email = email, PasswordHash = passwordHash };
      _context.Users.Add(newUser);
      await _context.SaveChangesAsync();
      return true;
    }

    public async Task<string?> LoginUser(string email, string password)
    {
      var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
      if (user == null)
      {
        return null;
      }

      if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
      {
        return null;
      }

      var tokenHandler = new JwtSecurityTokenHandler();
      var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]!);
      var tokenDescriptor = new SecurityTokenDescriptor
      {
        Subject = new ClaimsIdentity(new Claim[]
          {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email ?? string.Empty)
          }),
        Expires = DateTime.UtcNow.AddHours(1),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
      };
      var token = tokenHandler.CreateToken(tokenDescriptor);
      return tokenHandler.WriteToken(token);
    }
  }
}