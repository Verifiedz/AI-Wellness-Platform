using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace AIWrapperService.Tests.Fixtures;

/// <summary>
/// Custom WebApplicationFactory that configures the test environment
/// with proper settings for integration tests.
/// </summary>
/// <typeparam name="TProgram">The Program class from the main application</typeparam>
public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram>
    where TProgram : class
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Add in-memory configuration for tests
            var testConfig = new Dictionary<string, string?>
            {
                ["OpenAI:ApiKey"] = "test-openai-key-12345",
                ["OpenAI:BaseUrl"] = "https://api.openai.com/v1/",
                ["AiService:InternalApiKey"] = "test-internal-key-123",
                ["AiService:RateLimitPerMinute"] = "60"
            };

            config.AddInMemoryCollection(testConfig);
        });

        builder.UseEnvironment("Testing");
    }
}
