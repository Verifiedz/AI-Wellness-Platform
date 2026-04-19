using CommunityService.Infrastructure;
using CommunityService.Middleware;
using CommunityService.Services;
using Serilog;
using Serilog.Formatting.Compact;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "community-service")
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "community-service")
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
builder.Services.AddSingleton<DatabaseInitializer>();
builder.Services.AddScoped<ICommunityDbService, CommunityDbService>();
builder.Services.AddSingleton<IContentFilter, ContentFilter>();
builder.Services.AddSingleton<Ganss.Xss.HtmlSanitizer>(_ =>
{
    var sanitizer = new Ganss.Xss.HtmlSanitizer();
    sanitizer.AllowedTags.Clear();
    sanitizer.AllowedAttributes.Clear();
    return sanitizer;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("CommunityCors", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
        else
        {
            policy.SetIsOriginAllowed(_ => false).AllowAnyMethod().AllowAnyHeader();
        }
    });
});

var app = builder.Build();

var dbInitializer = app.Services.GetRequiredService<DatabaseInitializer>();
await dbInitializer.InitializeAsync();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();

app.UseHttpsRedirection();
app.UseCors("CommunityCors");
app.UseMiddleware<GatewayAuthMiddleware>();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Logger.LogInformation("Community Service starting...");
app.Run();
