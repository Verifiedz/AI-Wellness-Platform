using AIWellness.Auth.DTOs.Requests;
using AIWellness.Auth.Exceptions;
using AIWellness.Auth.Models;
using AIWellness.Auth.Repositories;
using AIWellness.Auth.Services;
using AIWellness.Auth.Services.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AIWellness.Auth.Tests.Services;

public class AuthServiceTests
{
  private readonly Mock<IUserRepository> _userRepository = new();
  private readonly Mock<IPasswordValidator> _passwordValidator = new();
  private readonly Mock<IEmailService> _emailService = new();
  private readonly Mock<INotificationService> _notificationService = new();
  private readonly Mock<IJwtService> _jwtService = new();
  private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
  private readonly Mock<IConfiguration> _configuration = new();
  private readonly Mock<ILogger<AuthService>> _logger = new();

  private AuthService CreateSut()
  {
    return new AuthService(
      _userRepository.Object,
      _passwordValidator.Object,
      _emailService.Object,
      _notificationService.Object,
      _jwtService.Object,
      _httpContextAccessor.Object,
      _configuration.Object,
      _logger.Object);
  }

  // SEC-08: AuthService uses domain exceptions not generic Exception
  [Fact]
  public async Task RegisterAsync_InvalidPassword_ThrowsAuthValidationException()
  {
    // Arrange
    _passwordValidator
      .Setup(v => v.ValidatePassword(It.IsAny<string>()))
      .Returns((false, "Too short"));

    var sut = CreateSut();
    var request = new RegisterRequest
    {
      Username = "testuser",
      Email = "test@example.com",
      Password = "weak"
    };

    // Act & Assert
    var ex = await Assert.ThrowsAsync<AuthValidationException>(
      () => sut.RegisterAsync(request));

    Assert.Equal("PASSWORD_POLICY", ex.ErrorCode);
  }

  [Fact]
  public async Task RegisterAsync_DuplicateEmail_ThrowsAuthConflictException()
  {
    // Arrange
    _passwordValidator
      .Setup(v => v.ValidatePassword(It.IsAny<string>()))
      .Returns((true, (string?)null));

    _userRepository
      .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
      .ReturnsAsync(new User { Id = Guid.NewGuid(), Email = "test@example.com", Username = "existing", PasswordHash = "hash" });

    var sut = CreateSut();
    var request = new RegisterRequest
    {
      Username = "testuser",
      Email = "test@example.com",
      Password = "ValidPass1!"
    };

    // Act & Assert
    var ex = await Assert.ThrowsAsync<AuthConflictException>(
      () => sut.RegisterAsync(request));

    Assert.Equal("EMAIL_EXISTS", ex.ErrorCode);
  }

  [Fact]
  public async Task RegisterAsync_DuplicateUsername_ThrowsAuthConflictException()
  {
    // Arrange
    _passwordValidator
      .Setup(v => v.ValidatePassword(It.IsAny<string>()))
      .Returns((true, (string?)null));

    _userRepository
      .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
      .ReturnsAsync((User?)null);

    _userRepository
      .Setup(r => r.GetByUsernameAsync(It.IsAny<string>()))
      .ReturnsAsync(new User { Id = Guid.NewGuid(), Email = "other@example.com", Username = "testuser", PasswordHash = "hash" });

    var sut = CreateSut();
    var request = new RegisterRequest
    {
      Username = "testuser",
      Email = "test@example.com",
      Password = "ValidPass1!"
    };

    // Act & Assert
    var ex = await Assert.ThrowsAsync<AuthConflictException>(
      () => sut.RegisterAsync(request));

    Assert.Equal("USERNAME_EXISTS", ex.ErrorCode);
  }

  [Fact]
  public async Task LoginAsync_UserNotFound_ThrowsAuthSecurityException()
  {
    // Arrange
    _userRepository
      .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
      .ReturnsAsync((User?)null);

    _userRepository
      .Setup(r => r.LogLoginAttemptAsync(It.IsAny<LoginAttempt>()))
      .Returns(Task.CompletedTask);

    var httpContext = new DefaultHttpContext();
    _httpContextAccessor.Setup(a => a.HttpContext).Returns(httpContext);

    var sut = CreateSut();
    var request = new LoginRequest { Email = "nobody@example.com", Password = "anypass" };

    // Act & Assert
    var ex = await Assert.ThrowsAsync<AuthSecurityException>(
      () => sut.LoginAsync(request));

    Assert.Equal("INVALID_CREDENTIALS", ex.ErrorCode);
  }

  [Fact]
  public async Task LoginAsync_AccountLocked_ThrowsAuthSecurityException()
  {
    // Arrange
    var user = new User
    {
      Id = Guid.NewGuid(),
      Email = "test@example.com",
      Username = "testuser",
      IsActive = true,
      PasswordHash = BCrypt.Net.BCrypt.HashPassword("ValidPass1!")
    };

    _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
    _userRepository.Setup(r => r.IsAccountLockedAsync(It.IsAny<Guid>())).ReturnsAsync(true);

    var httpContext = new DefaultHttpContext();
    _httpContextAccessor.Setup(a => a.HttpContext).Returns(httpContext);

    var sut = CreateSut();
    var request = new LoginRequest { Email = "test@example.com", Password = "ValidPass1!" };

    // Act & Assert
    var ex = await Assert.ThrowsAsync<AuthSecurityException>(
      () => sut.LoginAsync(request));

    Assert.Equal("ACCOUNT_LOCKED", ex.ErrorCode);
  }

  [Fact]
  public async Task GetUserInfoAsync_UserNotFound_ThrowsAuthNotFoundException()
  {
    // Arrange
    _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

    var sut = CreateSut();

    // Act & Assert
    var ex = await Assert.ThrowsAsync<AuthNotFoundException>(
      () => sut.GetUserInfoAsync("nobody@example.com"));

    Assert.Equal("USER_NOT_FOUND", ex.ErrorCode);
  }

  [Fact]
  public async Task ResetPasswordAsync_PasswordsDoNotMatch_ThrowsAuthValidationException()
  {
    // Arrange
    var sut = CreateSut();
    var request = new ResetPasswordRequest
    {
      Email = "test@example.com",
      Code = "123456",
      NewPassword = "NewPass1!",
      NewPassword2 = "DifferentPass1!"
    };

    // Act & Assert
    var ex = await Assert.ThrowsAsync<AuthValidationException>(
      () => sut.ResetPasswordAsync(request));

    Assert.Equal("PASSWORDS_DO_NOT_MATCH", ex.ErrorCode);
  }
}
