// Program.cs
using AIWellness.Auth.Repositories;
using AIWellness.Auth.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Npgsql;
using Dapper;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger
builder.Services.AddSwaggerGen();

// Configure JWT Authentication
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
    IssuerSigningKey = new SymmetricSecurityKey(
          Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured")))
  };
});

// Dependency Injection
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

var app = builder.Build();

// Configure the HTTP request pipeline
// if (app.Environment.IsDevelopment())
// {
app.UseSwagger();
app.UseSwaggerUI();
// }

// app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Database test endpoint
app.MapGet("/db-test", async (IConfiguration config) =>
{
  try
  {
    using var connection = new NpgsqlConnection(config.GetConnectionString("PostgreSQL"));
    await connection.OpenAsync();

    // Test 1: Count users
    var userCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM \"Users\"");

    // Test 2: Check all tables exist
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
    return Results.Problem($"Database error: {ex.Message}");
  }
});

app.Run();