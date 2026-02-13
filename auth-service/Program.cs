using AIWellness.Auth.Middleware;
using AIWellness.Auth.Repositories;
using AIWellness.Auth.Services;
using AIWellness.Auth.Services.Abstractions;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is missing");
builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
  options.TokenValidationParameters = new TokenValidationParameters
  {
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = builder.Configuration["Jwt:Issuer"],
    ValidAudience = builder.Configuration["Jwt:Audience"],
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
  };
});

builder.Services.AddAuthorization();

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddHttpClient<INotificationService, NotificationService>((serviceProvider, client) =>
{
  var config = serviceProvider.GetRequiredService<IConfiguration>();
  client.BaseAddress = new Uri(config["NotificationService:BaseUrl"]
      ?? throw new InvalidOperationException("NotificationService:BaseUrl not configured"));
});

builder.Services.AddScoped<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordValidator, PasswordValidator>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

builder.Services.AddLogging();

var app = builder.Build();

app.UseRateLimiting();

app.UseAuthentication();
app.UseAuthorization();

app.MapReverseProxy();
app.MapControllers();

app.MapGet("/db-test", async (IDbConnectionFactory dbFactory, ILogger<Program> logger) =>
{
  try
  {
    using var connection = dbFactory.CreateConnection();
    var userCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM users");
    var tables = await connection.QueryAsync<string>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    return Results.Ok(new
    {
      Status = "Database connected successfully!",
      UserCount = userCount,
      Tables = tables.ToList()
    });
  }
  catch (Exception ex)
  {
    logger.LogError(ex, "Database test failed");
    return Results.Problem($"Database error: {ex.Message}");
  }
});

app.Run();