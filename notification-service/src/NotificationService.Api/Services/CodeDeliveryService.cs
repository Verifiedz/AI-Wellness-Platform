namespace NotificationService.Api.Services;

using System.Net;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Text;

/// <summary>
/// Sends verification codes via SMTP email and/or Twilio SMS.
/// Uses configuration-driven provider settings with safe fallbacks.
/// </summary>
public class CodeDeliveryService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<CodeDeliveryService> _logger;
    private readonly HttpClient _httpClient;

    public CodeDeliveryService(
        IConfiguration configuration,
        ILogger<CodeDeliveryService> logger,
        HttpClient httpClient)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient;
    }

    public async Task<(bool emailSent, bool smsSent)> SendAsync(
        string email,
        string? phone,
        string codeType,
        string code,
        string channel)
    {
        var normalizedChannel = string.IsNullOrWhiteSpace(channel)
            ? "auto"
            : channel.Trim().ToLowerInvariant();

        var (subject, body) = BuildMessage(codeType, code);

        bool canTryEmail = normalizedChannel is "auto" or "email" or "both";
        bool canTrySms = normalizedChannel is "auto" or "sms" or "both";

        bool emailSent = false;
        bool smsSent = false;

        if (canTryEmail && !string.IsNullOrWhiteSpace(email))
            emailSent = await TrySendEmailAsync(email, subject, body);

        if (canTrySms && !string.IsNullOrWhiteSpace(phone))
            smsSent = await TrySendSmsAsync(phone, body);

        // In auto mode, if SMS failed or phone wasn't provided, try email fallback.
        if (normalizedChannel == "auto" && !smsSent && !emailSent && !string.IsNullOrWhiteSpace(email))
            emailSent = await TrySendEmailAsync(email, subject, body);

        return (emailSent, smsSent);
    }

    private async Task<bool> TrySendEmailAsync(string toEmail, string subject, string body)
    {
        var host = _configuration["Email:Smtp:Host"];
        var username = _configuration["Email:Smtp:Username"];
        var password = _configuration["Email:Smtp:Password"];
        var fromAddress = _configuration["Email:Smtp:FromAddress"];

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(fromAddress))
        {
            _logger.LogWarning("SMTP email delivery skipped: provider configuration is incomplete.");
            return false;
        }

        int port = _configuration.GetValue("Email:Smtp:Port", 587);
        bool enableSsl = _configuration.GetValue("Email:Smtp:EnableSsl", true);
        var fromName = _configuration["Email:Smtp:FromName"] ?? "AI Wellness";

        try
        {
            using var smtp = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(username, password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(fromAddress, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            message.To.Add(toEmail);

            await smtp.SendMailAsync(message);
            _logger.LogInformation("Verification email sent to {Email}", toEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", toEmail);
            return false;
        }
    }

    private async Task<bool> TrySendSmsAsync(string toPhone, string body)
    {
        var accountSid = _configuration["Sms:Twilio:AccountSid"];
        var authToken = _configuration["Sms:Twilio:AuthToken"];
        var fromNumber = _configuration["Sms:Twilio:FromNumber"];

        if (string.IsNullOrWhiteSpace(accountSid) ||
            string.IsNullOrWhiteSpace(authToken) ||
            string.IsNullOrWhiteSpace(fromNumber))
        {
            _logger.LogWarning("Twilio SMS delivery skipped: provider configuration is incomplete.");
            return false;
        }

        try
        {
            var endpoint = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";
            var formContent = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["To"] = toPhone,
                ["From"] = fromNumber,
                ["Body"] = body
            });

            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{accountSid}:{authToken}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

            var response = await _httpClient.PostAsync(endpoint, formContent);
            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Twilio SMS failed with status {StatusCode}: {Body}", response.StatusCode, responseBody);
                return false;
            }

            _logger.LogInformation("Verification SMS sent to {Phone}", toPhone);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification SMS to {Phone}", toPhone);
            return false;
        }
    }

    private static (string subject, string body) BuildMessage(string codeType, string code)
    {
        return codeType switch
        {
            "email_verify" => ("Verify your AI Wellness account", $"Your email verification code is: {code}"),
            "password_reset" => ("Reset your AI Wellness password", $"Your password reset code is: {code}"),
            "2fa" => ("Your AI Wellness security code", $"Your 2FA verification code is: {code}"),
            _ => ("Your AI Wellness code", $"Your verification code is: {code}")
        };
    }
}
