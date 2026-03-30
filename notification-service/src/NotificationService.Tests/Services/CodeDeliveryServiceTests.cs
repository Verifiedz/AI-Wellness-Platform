namespace NotificationService.Tests.Services;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using NotificationService.Api.Services;

/// <summary>
/// Unit tests for CodeDeliveryService.
/// Delivery providers (SMTP, Twilio) are intentionally left unconfigured so the
/// service exercises its "provider not configured" fallback paths without
/// making real network calls.
/// </summary>
public class CodeDeliveryServiceTests
{
    private static CodeDeliveryService BuildService(
        Dictionary<string, string?>? overrides = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(overrides ?? new Dictionary<string, string?>
            {
                // Providers unconfigured -> service falls back to dev-log path
                ["Email:Smtp:Host"] = "",
                ["Sms:Twilio:AccountSid"] = "",
            })
            .Build();

        var logger = NullLogger<CodeDeliveryService>.Instance;
        var httpClient = new HttpClient();

        return new CodeDeliveryService(config, logger, httpClient);
    }

    // ------------------------------------------------------------------ //
    // Channel routing: "email" channel with no SMTP config -> neither sent
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendAsync_EmailChannel_ReturnsFalseForBoth_WhenSmtpUnconfigured()
    {
        var sut = BuildService();

        var (emailSent, smsSent) = await sut.SendAsync(
            email: "user@example.com",
            phone: null,
            codeType: "2fa",
            code: "654321",
            channel: "email");

        Assert.False(emailSent);
        Assert.False(smsSent);
    }

    // ------------------------------------------------------------------ //
    // Channel routing: "sms" channel with no Twilio config -> neither sent
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendAsync_SmsChannel_ReturnsFalseForBoth_WhenTwilioUnconfigured()
    {
        var sut = BuildService();

        var (emailSent, smsSent) = await sut.SendAsync(
            email: null!,
            phone: "+12025551234",
            codeType: "2fa",
            code: "654321",
            channel: "sms");

        Assert.False(emailSent);
        Assert.False(smsSent);
    }

    // ------------------------------------------------------------------ //
    // Channel routing: "both" channel with no providers -> neither sent
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendAsync_BothChannel_ReturnsFalseForBoth_WhenNoProvidersConfigured()
    {
        var sut = BuildService();

        var (emailSent, smsSent) = await sut.SendAsync(
            email: "user@example.com",
            phone: "+12025551234",
            codeType: "email_verify",
            code: "ABC123",
            channel: "both");

        Assert.False(emailSent);
        Assert.False(smsSent);
    }

    // ------------------------------------------------------------------ //
    // Channel routing: "auto" with no phone and no provider -> neither sent
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendAsync_AutoChannel_ReturnsFalseForBoth_WhenNoPhone_AndSmtpUnconfigured()
    {
        var sut = BuildService();

        var (emailSent, smsSent) = await sut.SendAsync(
            email: "user@example.com",
            phone: null,
            codeType: "password_reset",
            code: "999999",
            channel: "auto");

        Assert.False(emailSent);
        Assert.False(smsSent);
    }

    // ------------------------------------------------------------------ //
    // Blank/null channel is normalised to "auto"
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendAsync_NullChannel_NormalisedToAuto_ReturnsFalseForBoth()
    {
        var sut = BuildService();

        var (emailSent, smsSent) = await sut.SendAsync(
            email: "user@example.com",
            phone: null,
            codeType: "2fa",
            code: "000000",
            channel: null!);

        Assert.False(emailSent);
        Assert.False(smsSent);
    }

    // ------------------------------------------------------------------ //
    // Returns a tuple, not an exception, for unknown code type
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task SendAsync_UnknownCodeType_DoesNotThrow()
    {
        var sut = BuildService();

        var (emailSent, smsSent) = await sut.SendAsync(
            email: "user@example.com",
            phone: null,
            codeType: "unknown_type",
            code: "111111",
            channel: "email");

        // No exception thrown; providers unconfigured so both remain false
        Assert.False(emailSent);
        Assert.False(smsSent);
    }
}
