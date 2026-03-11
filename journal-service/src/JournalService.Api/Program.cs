using JournalService.Api.Infrastructure;
using JournalService.Api.Middleware;
using JournalService.Api.Services;
using JournalService.Api.UserContext;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

builder.Services.AddSingleton<StoredProcedureExecutor>();
builder.Services.AddSingleton<DatabaseInitializer>();

builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<JournalEntryService>();

builder.Services.AddScoped<IUserContext, HttpUserContext>();

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

app.UseHttpsRedirection();
app.UseCors("JournalCors");

app.UseMiddleware<ExceptionHandlingMiddleware>();

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
