using ChatService;
using ChatService.Middleware;
using Serilog;
using Serilog.Formatting.Compact;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "chat-service")
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "chat-service")
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
builder.Services.RegisterServices(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy("DenyAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => false);
    });
});

var app = builder.Build();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();

app.UseCors("DenyAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.Run();
