using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using WellnessApp.NotificationService.Data;
using WellnessApp.NotificationService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register PostrgeSQL database context
builder.Services.AddDbContext<NotificationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQL"))
);

builder.Services.AddMemoryCache();
builder.Services.AddScoped<WellnessTipService>();
builder.Services.AddSingleton<FirebaseService>();
builder.Services.AddScoped<NotificationJobService>();

// Add Hangfire services
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options =>
    {
        options.UseNpgsqlConnection(builder.Configuration.GetConnectionString("PostgreSQL"));
    }));

// Add the processing server as IHostedService
builder.Services.AddHangfireServer();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// Add Hangfire Dashboard (accessible at /hangfire)
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter() }
});

// Schedule the daily notification job
// This will check every hour for users who need to receive their daily tip
RecurringJob.AddOrUpdate<NotificationJobService>(
    "send-daily-wellness-tips",
    service => service.SendDailyTipsAsync(),
    "0 * * * *"); // Every hour at minute 0

app.Run();


// Simple authorization filter for Hangfire Dashboard (allows all in development)
public class HangfireAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        // In production, add proper authentication here
        return true;
    }
}