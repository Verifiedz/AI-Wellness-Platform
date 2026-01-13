using AIWrapperService.APIs;
using AIWrapperService.Middleware;
using AIWrapperService.Services;
using DotNetEnv;

// Load .env file if it exists (for local development)
if (File.Exists(".env"))
{
    Env.Load();
}

var builder = WebApplication.CreateBuilder(args);

// ===== Service Registration =====

// Add API Explorer and Swagger for development
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "AI Wrapper Service",
        Version = "v1",
        Description = "Stateless HTTP API that normalizes LLM requests/responses for the AI Wellness Platform"
    });

    // Include XML comments for Swagger documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Add health checks
builder.Services.AddHealthChecks();

// Add ProblemDetails support
builder.Services.AddProblemDetails();

// Register typed HttpClient for OpenAI service
builder.Services.AddHttpClient<IOpenAIChatService, OpenAIChatService>()
    .ConfigureHttpClient(client =>
    {
        // Default timeout is set in the service constructor
        client.DefaultRequestHeaders.Add("User-Agent", "AIWrapperService/1.0");
    });

// ===== Application Pipeline =====

var app = builder.Build();

// Enable Swagger in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "AI Wrapper Service v1");
        options.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

// Exception handling middleware
app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        var exceptionHandlerFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var exception = exceptionHandlerFeature?.Error;

        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(exception, "Unhandled exception occurred");

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Internal Server Error",
            Detail = "An unexpected error occurred. Please try again later.",
            Instance = context.Request.Path,
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier
            }
        };

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problemDetails);
    });
});

// Security: Rate limiting middleware (before API key check to prevent brute force)
app.UseMiddleware<RateLimitingMiddleware>();

// Security: API key authentication middleware
app.UseMiddleware<InternalApiKeyMiddleware>();

// Map health check endpoint (no authentication required)
app.MapHealthChecks("/health");

// Map chat API endpoints
app.MapChatApi();

app.Run();

// Make Program class accessible to integration tests
public partial class Program { }
