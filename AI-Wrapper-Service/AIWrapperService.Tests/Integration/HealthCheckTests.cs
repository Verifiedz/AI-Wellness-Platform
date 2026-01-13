using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using FluentAssertions;
using AIWrapperService.Tests.Fixtures;

namespace AIWrapperService.Tests.Integration;

/// <summary>
/// Integration tests for health check endpoint.
/// </summary>
public class HealthCheckTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthCheckTests(CustomWebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsHealthy()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Healthy");
    }

    [Fact]
    public async Task HealthEndpoint_DoesNotRequireAuthentication()
    {
        // Act - No X-Internal-API-Key header
        var response = await _client.GetAsync("/health");

        // Assert - Should still succeed
        response.IsSuccessStatusCode.Should().BeTrue();
    }
}
