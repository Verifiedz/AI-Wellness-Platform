using NotificationService.Api.Infrastructure;
using NotificationService.Api.Middleware;
using NotificationService.Api.Services;
using NotificationService.Api.UserContext;
using Serilog;
using Serilog.Formatting.Compact;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "notification-service")
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "notification-service")
    .WriteTo.Console(new CompactJsonFormatter()));

builder.WebHost.UseSentry(options =>
{
    options.Dsn = builder.Configuration["Sentry:Dsn"] ?? string.Empty;
    options.Environment = builder.Environment.EnvironmentName;
    options.Release = typeof(Program).Assembly.GetName().Version?.ToString();
    options.TracesSampleRate = builder.Configuration.GetValue("Sentry:TracesSampleRate", 0.1);
    options.SendDefaultPii = false;
    options.AttachStacktrace = true;
});

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

// Async code delivery: the controller enqueues, the background service drains.
// Keeps /api/notifications/send-code from blocking on slow SMTP handshakes.
builder.Services.AddSingleton<CodeDeliveryQueue>();
builder.Services.AddHostedService<NotificationService.Api.BackgroundServices.CodeDeliveryBackgroundService>();

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

// Fail fast if Firebase path was configured but initialization failed.
// If the path is unset or empty, the service starts normally using Expo Push.
// If the path is set but the file is missing/invalid, abort immediately with a clear error.
var firebasePath = builder.Configuration["Firebase:ServiceAccountPath"];
if (!string.IsNullOrWhiteSpace(firebasePath) && !firebaseService.IsInitialized)
{
    throw new InvalidOperationException(
        $"Firebase:ServiceAccountPath is configured ('{firebasePath}') but initialization failed. " +
        "Ensure the file exists and is a valid service account JSON. " +
        "To run without Firebase, leave Firebase:ServiceAccountPath unset or empty.");
}

// Configure the HTTP request pipeline
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();

app.UseHttpsRedirection();

app.UseCors("NotificationCors");

// Global exception handling middleware (first in pipeline)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Service-to-service authentication on /internal/* (e.g. account deletion cascade)
app.UseMiddleware<GatewayAuthMiddleware>();

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

// Expose Program class so WebApplicationFactory<Program> can reference it from test projects.
public partial class Program { }