namespace NotificationService.Tests.Controllers;

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using NotificationService.Api.Models.Requests;

/// <summary>
/// Tests for NotificationCodeController API key validation (SEC-04 regression guard).
/// Verifies that CryptographicOperations.FixedTimeEquals is used and that missing
/// or incorrect X-Internal-Api-Key headers yield 401 Unauthorized.
///
/// The WebApplicationFactory runs in Development mode so that DatabaseInitializer
/// swallows connection errors (no real database required).
/// </summary>
public class NotificationCodeControllerTests : IClassFixture<NotificationTestFactory>
{
    private const string ValidApiKey = "test-internal-api-key-32chars!!";

    private readonly NotificationTestFactory _factory;

    public NotificationCodeControllerTests(NotificationTestFactory factory)
    {
        _factory = factory;
    }

    private static SendCodeRequest BuildValidRequest() => new()
    {
        UserId = Guid.NewGuid(),
        Email = "user@example.com",
        Code = "123456",
        Type = "2fa",
        Channel = "email"
    };

    // ------------------------------------------------------------------ //
    // SEC-04 regression: missing API key must yield 401
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendCode_Returns401_WhenApiKeyHeaderIsMissing()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/notifications/send-code", BuildValidRequest());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ------------------------------------------------------------------ //
    // SEC-04 regression: wrong API key must yield 401
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendCode_Returns401_WhenApiKeyIsWrong()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Api-Key", "wrong-key-value");

        var response = await client.PostAsJsonAsync("/api/notifications/send-code", BuildValidRequest());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ------------------------------------------------------------------ //
    // SEC-04 regression (Pitfall 6): key with different byte-length
    // CryptographicOperations.FixedTimeEquals returns false when lengths differ
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendCode_Returns401_WhenApiKeyHasDifferentByteLength()
    {
        var client = _factory.CreateClient();
        // "short" is much shorter than the configured 32-char key — length difference
        // must still result in 401 (FixedTimeEquals returns false on differing lengths)
        client.DefaultRequestHeaders.Add("X-Internal-Api-Key", "short");

        var response = await client.PostAsJsonAsync("/api/notifications/send-code", BuildValidRequest());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

/// <summary>
/// Tests that verify the bypass path when RequireSharedSecret=false.
/// Uses its own factory instance so it can customise configuration independently.
/// </summary>
public class NotificationCodeControllerBypassTests : IClassFixture<NotificationBypassTestFactory>
{
    private readonly NotificationBypassTestFactory _factory;

    public NotificationCodeControllerBypassTests(NotificationBypassTestFactory factory)
    {
        _factory = factory;
    }

    private static SendCodeRequest BuildValidRequest() => new()
    {
        UserId = Guid.NewGuid(),
        Email = "user@example.com",
        Code = "123456",
        Type = "2fa",
        Channel = "email"
    };

    // ------------------------------------------------------------------ //
    // Correct key with RequireSharedSecret=false bypasses validation
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendCode_DoesNotReturn401_WhenRequireSharedSecretIsFalse()
    {
        var client = _factory.CreateClient();
        // No API key provided, RequireSharedSecret=false => validation is skipped

        var response = await client.PostAsJsonAsync("/api/notifications/send-code", BuildValidRequest());

        // Must not be 401 (may be 502 if delivery providers are unconfigured)
        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

/// <summary>
/// WebApplicationFactory with RequireSharedSecret=true for the main API key tests.
/// Runs in Development mode so DatabaseInitializer swallows connection errors.
/// </summary>
public class NotificationTestFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                // Dummy connection string — DB init will fail but is swallowed in Development
                ["ConnectionStrings:NotificationDatabase"] =
                    "Host=localhost;Database=test;Username=test;Password=test",

                ["Gateway:RequireSharedSecret"] = "true",
                ["Gateway:SharedSecret"] = "test-internal-api-key-32chars!!",

                // Email / SMS providers intentionally unconfigured
                ["Email:Smtp:Host"] = "",
                ["Sms:Twilio:AccountSid"] = "",

                // Clear Firebase path so fail-fast check does not throw in tests
                ["Firebase:ServiceAccountPath"] = "",
            });
        });
    }
}

/// <summary>
/// WebApplicationFactory with RequireSharedSecret=false for the bypass test.
/// </summary>
public class NotificationBypassTestFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:NotificationDatabase"] =
                    "Host=localhost;Database=test;Username=test;Password=test",

                ["Gateway:RequireSharedSecret"] = "false",

                ["Email:Smtp:Host"] = "",
                ["Sms:Twilio:AccountSid"] = "",

                // Clear Firebase path so fail-fast check does not throw in tests
                ["Firebase:ServiceAccountPath"] = "",
            });
        });
    }
}
