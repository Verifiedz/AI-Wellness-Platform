using AIWellness.Auth.Services.Abstractions;

namespace AIWellness.Auth.Services;

/// <summary>
/// Fans out DELETE /internal/users/{userId} calls to each downstream service
/// using the per-service X-Internal-Api-Key shared secret. Each call runs in
/// parallel with a short timeout. Failures are recorded but never thrown so
/// the caller can still delete the primary auth record.
/// </summary>
public sealed class UserDataDeletionClient : IUserDataDeletionClient
{
  private readonly IHttpClientFactory _httpClientFactory;
  private readonly IConfiguration _configuration;
  private readonly ILogger<UserDataDeletionClient> _logger;

  public const string JournalClient = "journal-internal";
  public const string ChatClient = "chat-internal";
  public const string CommunityClient = "community-internal";
  public const string NotificationClient = "notification-internal";

  public UserDataDeletionClient(
      IHttpClientFactory httpClientFactory,
      IConfiguration configuration,
      ILogger<UserDataDeletionClient> logger)
  {
    _httpClientFactory = httpClientFactory;
    _configuration = configuration;
    _logger = logger;
  }

  public async Task<UserDeletionResult> DeleteAllUserDataAsync(
      Guid userId, CancellationToken cancellationToken = default)
  {
    var errors = new List<string>();

    var journalTask = TryDeleteAsync(JournalClient, "journal-service", userId, errors, cancellationToken);
    var chatTask = TryDeleteAsync(ChatClient, "chat-service", userId, errors, cancellationToken);
    var communityTask = TryDeleteAsync(CommunityClient, "community-service", userId, errors, cancellationToken);
    var notificationTask = TryDeleteAsync(NotificationClient, "notification-service", userId, errors, cancellationToken);

    await Task.WhenAll(journalTask, chatTask, communityTask, notificationTask);

    return new UserDeletionResult(
        JournalDeleted: journalTask.Result,
        ChatDeleted: chatTask.Result,
        CommunityDeleted: communityTask.Result,
        NotificationsDeleted: notificationTask.Result,
        Errors: errors);
  }

  private async Task<bool> TryDeleteAsync(
      string clientName,
      string serviceName,
      Guid userId,
      List<string> errors,
      CancellationToken cancellationToken)
  {
    try
    {
      var client = _httpClientFactory.CreateClient(clientName);
      if (client.BaseAddress is null)
      {
        _logger.LogWarning("No BaseAddress configured for {ServiceName} deletion client", serviceName);
        lock (errors) errors.Add($"{serviceName}: not configured");
        return false;
      }

      using var request = new HttpRequestMessage(HttpMethod.Delete, $"internal/users/{userId}");
      using var response = await client.SendAsync(request, cancellationToken);

      if (response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NotFound)
      {
        _logger.LogInformation(
            "Deleted user {UserId} data from {ServiceName}: {StatusCode}",
            userId, serviceName, (int)response.StatusCode);
        return true;
      }

      var body = await response.Content.ReadAsStringAsync(cancellationToken);
      _logger.LogWarning(
          "Downstream deletion failed for {ServiceName} (user {UserId}): {StatusCode} {Body}",
          serviceName, userId, (int)response.StatusCode, body);
      lock (errors) errors.Add($"{serviceName}: HTTP {(int)response.StatusCode}");
      return false;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Exception deleting user {UserId} data from {ServiceName}", userId, serviceName);
      lock (errors) errors.Add($"{serviceName}: {ex.GetType().Name}");
      return false;
    }
  }
}
