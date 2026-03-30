using AIWellness.Auth.Services;

namespace AIWellness.Auth.Tests.Services;

public class PasswordHasherTests
{
    private readonly BcryptPasswordHasher _sut = new();

    [Fact]
    public void HashPassword_ReturnsNonNullBcryptHash()
    {
        // Act
        var hash = _sut.HashPassword("ValidPass1!");

        // Assert
        Assert.NotNull(hash);
        Assert.StartsWith("$2", hash);
    }

    [Fact]
    public void VerifyHashedPassword_ReturnsTrue_ForCorrectPassword()
    {
        // Arrange
        var password = "ValidPass1!";
        var hash = _sut.HashPassword(password);

        // Act
        var result = _sut.VerifyHashedPassword(hash, password);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void VerifyHashedPassword_ReturnsFalse_ForWrongPassword()
    {
        // Arrange
        var hash = _sut.HashPassword("ValidPass1!");

        // Act
        var result = _sut.VerifyHashedPassword(hash, "WrongPassword!");

        // Assert
        Assert.False(result);
    }
}
