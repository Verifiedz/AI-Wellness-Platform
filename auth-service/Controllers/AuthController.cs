using AIWellness.Auth.DTOs;
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
      try
      {
        var token = await _authService.RegisterAsync(request);
        return Ok(new { token });
      }
      catch (Exception ex)
      {
        return BadRequest(new { message = ex.Message });
      }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
      try
      {
        var token = await _authService.LoginAsync(request);
        return Ok(new { token });
      }
      catch (Exception ex)
      {
        return Unauthorized(new { message = ex.Message });
      }
    }
  }
}