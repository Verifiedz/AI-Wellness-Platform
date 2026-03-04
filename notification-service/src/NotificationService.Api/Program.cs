using NotificationService.Api.Infrastructure;
using NotificationService.Api.Middleware;
using NotificationService.Api.Services;
using NotificationService.Api.UserContext;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Add HttpContextAccessor for user context
builder.Services.AddHttpContextAccessor();

// Register infrastructure services
builder.Services.AddSingleton<StoredProcedureExecutor>();
builder.Services.AddSingleton<DatabaseInitializer>();

// Register application services
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<NotificationService.Api.Services.NotificationService>();
builder.Services.AddScoped<WellnessTipService>();
builder.Services.AddHttpClient<CodeDeliveryService>();

// Push notification provider: Expo Push API (works with Expo Go on iOS & Android)
builder.Services.AddHttpClient<ExpoPushService>();

// Firebase is kept for future production use but is no longer required for sending
builder.Services.AddSingleton<FirebaseService>();

// Register user context
builder.Services.AddScoped<IUserContext, HttpUserContext>();

// Register background services
   builder.Services.AddHostedService<NotificationService.Api.BackgroundServices.NotificationScheduler>();

// Add CORS with strict production defaults.
builder.Services.AddCors(options =>
{
    options.AddPolicy("NotificationCors", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
            if (allowedOrigins.Length > 0)
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            }
            else
            {
                // Explicitly block cross-origin requests if production origins are not configured.
                policy.SetIsOriginAllowed(_ => false)
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            }
        }
    });
});

var app = builder.Build();

// Initialize database on startup
var dbInitializer = app.Services.GetRequiredService<DatabaseInitializer>();
await dbInitializer.InitializeAsync();

// Initialize Firebase (optional – not required when using Expo Push for delivery)
var firebaseService = app.Services.GetRequiredService<FirebaseService>();
try
{
    firebaseService.Initialize();
}
catch (Exception ex)
{
    app.Logger.LogWarning("Firebase initialization skipped: {Message}. " +
        "Push notifications will be sent via Expo Push API.", ex.Message);
}

// Configure the HTTP request pipeline
app.UseHttpsRedirection();

app.UseCors("NotificationCors");

// Global exception handling middleware (first in pipeline)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// User context middleware - extracts user from YARP headers
// Check if development mode allows testing without gateway
var allowTestingWithoutGateway = builder.Configuration.GetValue<bool>("Development:AllowTestingWithoutGateway");

if (allowTestingWithoutGateway && app.Environment.IsDevelopment())
{
    app.Logger.LogWarning("DEVELOPMENT MODE: Running without YARP gateway. Using DevelopmentUserContextMiddleware.");
    app.UseMiddleware<DevelopmentUserContextMiddleware>();
}
else
{
    app.Logger.LogInformation("PRODUCTION MODE: Expecting requests from YARP gateway with X-User-Id header.");
    app.UseMiddleware<UserContextMiddleware>();
}

app.MapControllers();

// Log startup information
app.Logger.LogInformation("Notification Service starting...");
app.Logger.LogInformation("Environment: {Environment}", app.Environment.EnvironmentName);
app.Logger.LogInformation("Development mode (no gateway): {AllowTesting}", allowTestingWithoutGateway);

app.Run();