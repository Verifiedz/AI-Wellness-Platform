namespace NotificationService.Api.Services;

using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;

/// <summary>
/// Service for sending push notifications via Firebase Cloud Messaging
/// </summary>
public class FirebaseService
{
    private readonly ILogger<FirebaseService> _logger;
    private readonly IConfiguration _configuration;
    private readonly int _maxRetryAttempts;
    private FirebaseApp? _firebaseApp;

    public FirebaseService(
        ILogger<FirebaseService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _maxRetryAttempts = _configuration.GetValue<int>("NotificationScheduler:MaxRetryAttempts", 3);
    }

    /// <summary>
    /// Initialize Firebase Admin SDK
    /// </summary>
    public void Initialize()
    {
        try
        {
            var serviceAccountPath = _configuration["Firebase:ServiceAccountPath"];

            if (string.IsNullOrWhiteSpace(serviceAccountPath))
            {
                _logger.LogWarning("Firebase service account path not configured. Push notifications will not work.");
                return;
            }

            if (!File.Exists(serviceAccountPath))
            {
                _logger.LogWarning("Firebase service account file not found at {Path}. Push notifications will not work.", 
                    serviceAccountPath);
                return;
            }

            _firebaseApp = FirebaseApp.Create(new AppOptions
            {
                Credential = GoogleCredential.FromFile(serviceAccountPath)
            });

            _logger.LogInformation("Firebase Admin SDK initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Firebase Admin SDK: {Message}", ex.Message);
        }
    }

    /// <summary>
    /// Send a push notification with automatic retry logic
    /// </summary>
    public async Task<bool> SendNotificationWithRetryAsync(
        string deviceToken,
        string title,
        string body,
        Dictionary<string, string>? data = null)
    {
        if (_firebaseApp == null)
        {
            _logger.LogWarning("Firebase not initialized. Cannot send notification.");
            return false;
        }

        for (int attempt = 1; attempt <= _maxRetryAttempts; attempt++)
        {
            try
            {
                await SendNotificationAsync(deviceToken, title, body, data);
                _logger.LogInformation("Notification sent successfully on attempt {Attempt}", attempt);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Notification attempt {Attempt}/{MaxAttempts} failed: {Error}",
                    attempt, _maxRetryAttempts, ex.Message);

                if (attempt == _maxRetryAttempts)
                {
                    _logger.LogError("Notification failed after {MaxAttempts} attempts", _maxRetryAttempts);
                    return false;
                }

                // Exponential backoff: 1s, 2s, 4s
                int delayMs = (int)Math.Pow(2, attempt - 1) * 1000;
                await Task.Delay(delayMs);
            }
        }

        return false;
    }

    /// <summary>
    /// Send a single push notification (no retry)
    /// </summary>
    private async Task SendNotificationAsync(
        string deviceToken,
        string title,
        string body,
        Dictionary<string, string>? data = null)
    {
        var message = new Message
        {
            Token = deviceToken,
            Notification = new Notification
            {
                Title = title,
                Body = body
            },
            Data = data
        };

        var messaging = FirebaseMessaging.DefaultInstance;
        var response = await messaging.SendAsync(message);

        _logger.LogDebug("Firebase response: {Response}", response);
    }

    /// <summary>
    /// Check if Firebase is initialized and ready
    /// </summary>
    public bool IsInitialized => _firebaseApp != null;
}