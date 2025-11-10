using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;

namespace WellnessApp.NotificationService.Services
{
    public class FirebaseService
    {
        private readonly FirebaseMessaging _messaging;
        private readonly ILogger<FirebaseService> _logger;

        public FirebaseService(IConfiguration configuration, ILogger<FirebaseService> logger)
        {
            _logger = logger;

            if (FirebaseApp.DefaultInstance == null)
            {
                var credentialsPath = configuration["Firebase:CredentialsPath"];

                FirebaseApp.Create(new AppOptions
                {
                    Credential = GoogleCredential.FromFile(credentialsPath)
                });

                _logger.LogInformation("Firebase initialized successfully");
            }

            _messaging = FirebaseMessaging.DefaultInstance;
        }

        public async Task<bool> SendNotificationAsync(
            string fcmToken,
            string title,
            string body)
        {
            try
            {
                var message = new Message
                {
                    Token = fcmToken,
                    Notification = new Notification
                    {
                        Title = title,
                        Body = body
                    },
                    Data = new Dictionary<string, string>
                    {
                        {"type", "daily_tip" },
                        {"timestamp", DateTime.UtcNow.ToString("o") }
                    }
                };

                var response = await _messaging.SendAsync(message);
                _logger.LogInformation("Successfully sent notification. MessageId: {MessageId}", response);

                return true;
            }
            catch (FirebaseMessagingException ex)
            {
                _logger.LogError(ex, "Firebase error sending notification to token: {Token}. Error: {ErrorCode}", fcmToken, ex.MessagingErrorCode);
                return false;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification");
                return false;
            }
        }

        public async Task<bool> SendTestNotificationAsync(string fcmToken)
        {
            return await SendNotificationAsync(
                fcmToken,
                "Test Notifcation ",
                "If you see this, notifications are working!");
        }
    }
}
