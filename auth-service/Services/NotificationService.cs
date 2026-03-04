using AIWellness.Auth.Services.Abstractions;

namespace AIWellness.Auth.Services;

public class NotificationService : INotificationService
{
  private readonly HttpClient _httpClient;
  private readonly ILogger<NotificationService> _logger;
  private readonly IConfiguration _configuration;

  public NotificationService(HttpClient httpClient, ILogger<NotificationService> logger, IConfiguration configuration)
  {
    _httpClient = httpClient;
    _logger = logger;
    _configuration = configuration;
  }

  public async Task SendVerificationCodeAsync(Guid userId, string email, string code, string type, string? phone = null, string channel = "auto")
  {
    try
    {
      var endpoint = _configuration["NotificationService:SendCodeEndpoint"]
          ?? "/api/notifications/send-code";
      var configuredChannel = _configuration["NotificationService:DeliveryChannel"];

      var payload = new
      {
        UserId = userId,
        Email = email,
        Phone = phone,
        Code = code,
        Type = type,
        Channel = string.IsNullOrWhiteSpace(configuredChannel) ? channel : configuredChannel,
        Timestamp = DateTime.UtcNow
      };

      var response = await _httpClient.PostAsJsonAsync(endpoint, payload);
      if (!response.IsSuccessStatusCode)
      {
        _logger.LogWarning("Failed to send code to notification service. Status: {StatusCode}", response.StatusCode);
      }
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error sending verification code to notification service");
    }
  }
}