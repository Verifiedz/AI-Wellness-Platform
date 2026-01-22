using AIWellness.Auth.Models;
using AIWellness.Auth.Services;
using Microsoft.AspNetCore.Mvc;

namespace AIWellness.Auth.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class AuthController : ControllerBase
  {
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
      _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
      var success = await _authService.RegisterUser(request.Email, request.Password);
      if (!success)
      {
        return BadRequest(new { message = "User with this email already exists." });
      }
      return Ok(new { message = "User registered successfully." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
      var token = await _authService.LoginUser(request.Email, request.Password);
      if (token == null)
      {
        return Unauthorized(new { message = "Invalid email or password." });
      }
      return Ok(new { token = token, message = "Login successful." });
    }
  }
}