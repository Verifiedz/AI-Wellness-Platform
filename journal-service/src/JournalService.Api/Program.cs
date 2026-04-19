using JournalService.Api.Infrastructure;
using JournalService.Api.Middleware;
using JournalService.Api.Services;
using JournalService.Api.UserContext;
using Microsoft.AspNetCore.DataProtection;
using Serilog;
using Serilog.Formatting.Compact;
using StackExchange.Redis;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "journal-service")
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "journal-service")
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

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

builder.Services.AddSingleton<StoredProcedureExecutor>();
builder.Services.AddSingleton<DatabaseInitializer>();

builder.Services.AddScoped<IDatabaseService, DatabaseService>();
builder.Services.AddScoped<JournalEntryService>();
builder.Services.AddScoped<PatternAnalysisService>();
builder.Services.AddScoped<AssessmentService>();
builder.Services.AddScoped<ExportService>();
builder.Services.AddScoped<EscalationService>();

builder.Services.AddScoped<IUserContext, HttpUserContext>();

// Field-level encryption for journal entry content (Issue 10).
//
// We layer ASP.NET Data Protection over the ORM so the Postgres rows are
// encrypted at rest with a key ring Sakina controls, rather than relying on
// disk encryption alone. Keys are persisted to Redis so every journal-service
// replica shares the same ring; if Redis is not configured we fall back to a
// local key directory so dev data stays readable across restarts.
var journalDpBuilder = builder.Services
    .AddDataProtection()
    .SetApplicationName("sakina-journal-service");

var journalRedisConnectionString = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrWhiteSpace(journalRedisConnectionString))
{
    var redis = ConnectionMultiplexer.Connect(journalRedisConnectionString);
    builder.Services.AddSingleton<IConnectionMultiplexer>(redis);
    journalDpBuilder.PersistKeysToStackExchangeRedis(redis, "sakina:dataprotection:journal");
}
else
{
    var keyDir = builder.Configuration["DataProtection:KeyPath"] ?? "/var/keys/journal";
    Directory.CreateDirectory(keyDir);
    journalDpBuilder.PersistKeysToFileSystem(new DirectoryInfo(keyDir));
}

builder.Services.AddSingleton<IFieldProtector, FieldProtector>();

builder.Services.AddSingleton<Ganss.Xss.HtmlSanitizer>(_ =>
{
    var sanitizer = new Ganss.Xss.HtmlSanitizer();
    sanitizer.AllowedTags.Clear();
    sanitizer.AllowedAttributes.Clear();
    return sanitizer;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("JournalCors", policy =>
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
                policy.SetIsOriginAllowed(_ => false)
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            }
        }
    });
});

var app = builder.Build();

var dbInitializer = app.Services.GetRequiredService<DatabaseInitializer>();
await dbInitializer.InitializeAsync();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();

app.UseHttpsRedirection();
app.UseCors("JournalCors");

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Service-to-service authentication on /internal/* (account deletion cascade, etc.)
app.UseMiddleware<GatewayAuthMiddleware>();

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

app.Logger.LogInformation("Journal Service starting...");
app.Logger.LogInformation("Environment: {Environment}", app.Environment.EnvironmentName);
app.Logger.LogInformation("Development mode (no gateway): {AllowTesting}", allowTestingWithoutGateway);

app.Run();
