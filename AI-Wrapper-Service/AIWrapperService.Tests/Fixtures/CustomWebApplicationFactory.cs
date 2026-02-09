using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using AIWrapperService.Services;

namespace AIWrapperService.Tests.Fixtures;

/// <summary>
/// Custom WebApplicationFactory that configures the test environment
/// with proper settings for integration tests.
/// </summary>
/// <typeparam name="TProgram">The Program class from the main application</typeparam>
public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram>
    where TProgram : class
{
    /// <summary>
    /// Optional mock HTTP handler for intercepting OpenAI API calls.
    /// Set this before creating the client to mock upstream responses.
    /// </summary>
    public HttpMessageHandler? MockHttpHandler { get; set; }

    /// <summary>
    /// Optional configuration overrides for testing specific scenarios.
    /// </summary>
    public Dictionary<string, string?>? ConfigurationOverrides { get; set; }

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

            // Apply any configuration overrides
            if (ConfigurationOverrides != null)
            {
                foreach (var kvp in ConfigurationOverrides)
                {
                    testConfig[kvp.Key] = kvp.Value;
                }
            }

            config.AddInMemoryCollection(testConfig);
        });

        builder.ConfigureServices(services =>
        {
            // If a mock handler is provided, replace the HttpClient for OpenAI
            if (MockHttpHandler != null)
            {
                // Remove all existing registrations for IOpenAIChatService
                services.RemoveAll<IOpenAIChatService>();

                // Remove existing HttpClient registrations for the service
                var httpClientBuilder = services.AddHttpClient<IOpenAIChatService, OpenAIChatService>();

                // Configure the primary handler to use our mock
                httpClientBuilder.ConfigurePrimaryHttpMessageHandler(() => MockHttpHandler);
            }
        });

        builder.UseEnvironment("Testing");
    }
}

/// <summary>
/// Factory that creates a fresh instance for each test to avoid state sharing.
/// Useful for rate limiting tests where state needs to be isolated.
/// </summary>
public class IsolatedWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram>
    where TProgram : class
{
    public HttpMessageHandler? MockHttpHandler { get; set; }
    public Dictionary<string, string?>? ConfigurationOverrides { get; set; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            var testConfig = new Dictionary<string, string?>
            {
                ["OpenAI:ApiKey"] = "test-openai-key-12345",
                ["OpenAI:BaseUrl"] = "https://api.openai.com/v1/",
                ["AiService:InternalApiKey"] = "test-internal-key-123",
                ["AiService:RateLimitPerMinute"] = "5" // Low limit for testing
            };

            if (ConfigurationOverrides != null)
            {
                foreach (var kvp in ConfigurationOverrides)
                {
                    testConfig[kvp.Key] = kvp.Value;
                }
            }

            config.AddInMemoryCollection(testConfig);
        });

        builder.ConfigureServices(services =>
        {
            if (MockHttpHandler != null)
            {
                // Remove all existing registrations for IOpenAIChatService
                services.RemoveAll<IOpenAIChatService>();

                // Add HttpClient with mock handler
                var httpClientBuilder = services.AddHttpClient<IOpenAIChatService, OpenAIChatService>();
                httpClientBuilder.ConfigurePrimaryHttpMessageHandler(() => MockHttpHandler);
            }
        });

        builder.UseEnvironment("Testing");
    }
}
