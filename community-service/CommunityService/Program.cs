using CommunityService.Infrastructure;
using CommunityService.Middleware;
using CommunityService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<DatabaseInitializer>();
builder.Services.AddScoped<ICommunityDbService, CommunityDbService>();
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

app.UseHttpsRedirection();
app.UseCors("CommunityCors");
app.UseMiddleware<GatewayAuthMiddleware>();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Logger.LogInformation("Community Service starting...");
app.Run();
