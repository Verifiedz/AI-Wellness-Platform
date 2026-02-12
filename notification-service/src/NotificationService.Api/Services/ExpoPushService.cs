namespace NotificationService.Api.Services;

using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

/// <summary>
/// Service for sending push notifications via the Expo Push Notification API.
/// Works with Expo Go on both iOS and Android without requiring Firebase/APNs setup.
/// Docs: https://docs.expo.dev/push-notifications/sending-notifications/
/// </summary>
public class ExpoPushService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ExpoPushService> _logger;
    private readonly int _maxRetryAttempts;
    private readonly int _retryDelaySeconds;

    private const string EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public ExpoPushService(
        HttpClient httpClient,
        ILogger<ExpoPushService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _maxRetryAttempts = configuration.GetValue<int>("NotificationScheduler:MaxRetryAttempts", 3);
        _retryDelaySeconds = configuration.GetValue<int>("NotificationScheduler:RetryDelaySeconds", 1);
    }

    /// <summary>
    /// Send a push notification via Expo Push API with automatic retry logic
    /// </summary>
    public async Task<bool> SendNotificationWithRetryAsync(
        string pushToken,
        string title,
        string body,
        Dictionary<string, string>? data = null)
    {
        if (string.IsNullOrWhiteSpace(pushToken))
        {
            _logger.LogWarning("Cannot send Expo push notification: push token is empty");
            return false;
        }

        for (int attempt = 1; attempt <= _maxRetryAttempts; attempt++)
        {
            try
            {
                var success = await SendNotificationAsync(pushToken, title, body, data);

                if (success)
                {
                    _logger.LogInformation(
                        "Expo push notification sent successfully on attempt {Attempt}", attempt);
                    return true;
                }

                throw new Exception("Expo Push API returned error status");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    "Expo push attempt {Attempt}/{MaxAttempts} failed: {Error}",
                    attempt, _maxRetryAttempts, ex.Message);

                if (attempt == _maxRetryAttempts)
                {
                    _logger.LogError(
                        "Expo push notification failed after {MaxAttempts} attempts",
                        _maxRetryAttempts);
                    return false;
                }

                // Exponential backoff: 1s, 2s, 4s …
                int delayMs = (int)Math.Pow(2, attempt - 1) * _retryDelaySeconds * 1000;
                _logger.LogDebug("Waiting {DelayMs}ms before retry…", delayMs);
                await Task.Delay(delayMs);
            }
        }

        return false;
    }

    /// <summary>
    /// Send a single push notification (no retry)
    /// </summary>
    private async Task<bool> SendNotificationAsync(
        string pushToken,
        string title,
        string body,
        Dictionary<string, string>? data = null)
    {
        var payload = new ExpoPushMessage
        {
            To = pushToken,
            Title = title,
            Body = body,
            Sound = "default",
            Data = data
        };

        // Wrap in an array so Expo always returns an array in the response.
        // Single object → {"data": {...}}  (breaks List<> deserialization)
        // Array          → {"data": [{...}]} (always works)
        var json = JsonSerializer.Serialize(new[] { payload }, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _logger.LogDebug("Sending Expo push notification to token: {Token}",
            pushToken.Length > 30 ? pushToken[..30] + "…" : pushToken);

        var response = await _httpClient.PostAsync(EXPO_PUSH_URL, content);
        var responseBody = await response.Content.ReadAsStringAsync();

        _logger.LogDebug("Expo Push API response ({StatusCode}): {Body}",
            response.StatusCode, responseBody);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Expo Push API HTTP error {StatusCode}: {Body}",
                response.StatusCode, responseBody);
            return false;
        }

        // Parse response to check ticket-level status
        var result = JsonSerializer.Deserialize<ExpoPushResponse>(responseBody, JsonOptions);

        if (result?.Data is { Count: > 0 })
        {
            var ticket = result.Data[0];

            if (ticket.Status == "ok")
            {
                _logger.LogInformation("Expo push ticket OK (id: {TicketId})", ticket.Id);
                return true;
            }

            _logger.LogError(
                "Expo push ticket error: {Status} – {Message} (Details: {Details})",
                ticket.Status, ticket.Message, ticket.Details?.Error);
            return false;
        }

        _logger.LogWarning("Expo Push API returned empty response data");
        return false;
    }

    /// <summary>
    /// Always ready – unlike Firebase, no SDK initialisation is required.
    /// </summary>
    public bool IsInitialized => true;
}

// ── Expo Push API DTOs ────────────────────────────────────────────────────────

public class ExpoPushMessage
{
    public string To { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Sound { get; set; }
    public Dictionary<string, string>? Data { get; set; }
}

public class ExpoPushResponse
{
    public List<ExpoPushTicket> Data { get; set; } = new();
}

public class ExpoPushTicket
{
    public string Status { get; set; } = string.Empty;
    public string? Id { get; set; }
    public string? Message { get; set; }
    public ExpoPushTicketDetails? Details { get; set; }
}

public class ExpoPushTicketDetails
{
    public string? Error { get; set; }
}
