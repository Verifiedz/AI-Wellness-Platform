using AIWellness.Auth.Models;
using AIWellness.Auth.Services;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AIWellness.Auth.Tests.Services;

public class JwtServiceTests
{
    private static IConfiguration BuildConfiguration()
    {
        var values = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "TestSecretKeyForJwtTokenGenerationThatIsAtLeast256BitsLong!!!!",
            ["Jwt:Issuer"] = "TestIssuer",
            ["Jwt:Audience"] = "TestAudience",
            ["Jwt:ExpiryInMinutes"] = "60"
        };
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }

    private static User BuildTestUser() =>
        new()
        {
            Id = Guid.NewGuid(),
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = "$2a$11$fakehashfortesting",
            IsActive = true,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

    [Fact]
    public void GenerateJwtToken_ContainsUserIdClaim()
    {
        // Arrange
        var configuration = BuildConfiguration();
        var sut = new JwtService(configuration);
        var user = BuildTestUser();

        // Act
        var token = sut.GenerateJwtToken(user);

        // Assert
        // JwtSecurityTokenHandler maps ClaimTypes.NameIdentifier to the short claim name "nameid"
        // when writing JWT standard claims. We check both forms to be resilient.
        var decoded = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var claim = decoded.Claims.FirstOrDefault(c =>
            c.Type == ClaimTypes.NameIdentifier ||
            c.Type == "nameid" ||
            c.Type == "nameidentifier");
        Assert.NotNull(claim);
        Assert.Equal(user.Id.ToString(), claim.Value);
    }

    [Fact]
    public void GenerateJwtToken_ContainsEmailClaim()
    {
        // Arrange
        var configuration = BuildConfiguration();
        var sut = new JwtService(configuration);
        var user = BuildTestUser();

        // Act
        var token = sut.GenerateJwtToken(user);

        // Assert
        // JwtSecurityTokenHandler maps ClaimTypes.Email to "emailaddress" short name in JWT claims.
        var decoded = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var claim = decoded.Claims.FirstOrDefault(c =>
            c.Type == ClaimTypes.Email ||
            c.Type == "emailaddress" ||
            c.Type == "email");
        Assert.NotNull(claim);
        Assert.Equal(user.Email, claim.Value);
    }
}
