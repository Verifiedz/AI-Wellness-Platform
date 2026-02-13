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

  public async Task SendVerificationCodeAsync(Guid userId, string email, string code, string type)
  {
    try
    {
      var endpoint = _configuration["NotificationService:SendCodeEndpoint"]
          ?? "/api/notifications/send-code";

      var payload = new
      {
        UserId = userId,
        Email = email,
        Code = code,
        Type = type,
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