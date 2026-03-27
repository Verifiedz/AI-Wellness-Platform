using CommunityService.Infrastructure;
using CommunityService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<DatabaseInitializer>();
builder.Services.AddScoped<CommunityDbService>();

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
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Logger.LogInformation("Community Service starting...");
app.Run();
