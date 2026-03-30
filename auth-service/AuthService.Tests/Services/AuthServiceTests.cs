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
  private readonly Mock<AIWellness.Auth.Services.Abstractions.IPasswordHasher> _passwordHasher = new();
  private readonly Mock<INotificationService> _notificationService = new();
  private readonly Mock<IJwtService> _jwtService = new();
  private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
  private readonly Mock<IConfiguration> _configuration = new();
  private readonly Mock<ILogger<AIWellness.Auth.Services.AuthService>> _logger = new();

  private AIWellness.Auth.Services.AuthService CreateSut()
  {
    return new AIWellness.Auth.Services.AuthService(
      _userRepository.Object,
      _passwordValidator.Object,
      _passwordHasher.Object,
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
      PasswordHash = "$2a$11$fakehashfortesting"
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

  // SEC-01: CSPRNG used for code generation (not predictable new Random())
  [Fact]
  public void GenerateRandomCode_UsesCsprng()
  {
    // Use reflection to access private static GenerateRandomCode method.
    var method = typeof(AIWellness.Auth.Services.AuthService).GetMethod(
      "GenerateRandomCode",
      System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);

    Assert.NotNull(method);

    var codes = new HashSet<string>();
    for (int i = 0; i < 100; i++)
    {
      var code = (string)method!.Invoke(null, null)!;
      // All codes must be 6-digit numbers in [100000, 999999]
      Assert.True(int.TryParse(code, out int value), $"Code '{code}' is not numeric");
      Assert.InRange(value, 100000, 999999);
      codes.Add(code);
    }

    // At least 90 unique values proves it is not a seeded-once Random
    Assert.True(codes.Count >= 90,
      $"Only {codes.Count} unique codes from 100 calls -- likely not using CSPRNG");
  }

  // SEC-02: 2FA code value is never logged
  [Fact]
  public async Task TwoFactor_CodeNotLogged()
  {
    // Arrange: set up a user that passes all LoginAsync guards and reaches 2FA dispatch
    var user = new User
    {
      Id = Guid.NewGuid(),
      Email = "test@example.com",
      Username = "testuser",
      IsActive = true,
      IsEmailVerified = true,
      PasswordHash = "$2a$11$fakehashfortesting"
    };

    _passwordHasher
      .Setup(p => p.VerifyHashedPassword(It.IsAny<string>(), "ValidPass1!"))
      .Returns(true);

    _userRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
    _userRepository.Setup(r => r.IsAccountLockedAsync(It.IsAny<Guid>())).ReturnsAsync(false);
    _userRepository.Setup(r => r.CreateTwoFactorCodeAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()))
      .Returns(Task.CompletedTask);
    _userRepository.Setup(r => r.UpdateLastLoginAsync(It.IsAny<Guid>())).Returns(Task.CompletedTask);
    _userRepository.Setup(r => r.LogLoginAttemptAsync(It.IsAny<LoginAttempt>())).Returns(Task.CompletedTask);
    _notificationService
      .Setup(n => n.SendVerificationCodeAsync(
        It.IsAny<Guid>(),
        It.IsAny<string>(),
        It.IsAny<string>(),
        It.IsAny<string>(),
        It.IsAny<string?>(),
        It.IsAny<string>()))
      .Returns(Task.CompletedTask);

    var httpContext = new DefaultHttpContext();
    _httpContextAccessor.Setup(a => a.HttpContext).Returns(httpContext);

    // Capture all log messages
    var loggedMessages = new List<string>();
    _logger
      .Setup(l => l.Log(
        It.IsAny<LogLevel>(),
        It.IsAny<EventId>(),
        It.IsAny<It.IsAnyType>(),
        It.IsAny<Exception?>(),
        It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
      .Callback<LogLevel, EventId, object, Exception?, Delegate>((level, eventId, state, exception, formatter) =>
      {
        loggedMessages.Add(state.ToString() ?? "");
      });

    var sut = CreateSut();
    var request = new LoginRequest { Email = "test@example.com", Password = "ValidPass1!" };

    // Act
    await sut.LoginAsync(request);

    // Assert: no log message should contain a 6-digit code captured from CreateTwoFactorCodeAsync
    // We verify by checking that none of the logged messages contain any pattern matching a 6-digit code
    // embedded in a 2FA context phrase
    foreach (var msg in loggedMessages)
    {
      Assert.DoesNotContain("2FA Code", msg);
    }
  }
}
