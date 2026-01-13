using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using FluentAssertions;
using AIWrapperService.Tests.Fixtures;

namespace AIWrapperService.Tests.Integration;

/// <summary>
/// Integration tests for API key authentication.
/// Tests the InternalApiKeyMiddleware behavior.
/// </summary>
public class ChatApiAuthenticationTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ChatApiAuthenticationTests(CustomWebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ChatComplete_WithoutApiKey_Returns401()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Post, "/v1/chat/complete")
        {
            Content = JsonContent.Create(new
            {
                sessionId = "test-session",
                messages = new[] { new { role = "user", content = "Hello" } },
                temperature = 0.7
            })
        };

        // Act - No X-Internal-API-Key header
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().Be("Authentication Required");
        problemDetails.Detail.Should().Contain("X-Internal-API-Key");
        problemDetails.Extensions.Should().ContainKey("traceId");
    }

    [Fact]
    public async Task ChatComplete_WithInvalidApiKey_Returns401()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Post, "/v1/chat/complete")
        {
            Content = JsonContent.Create(new
            {
                sessionId = "test-session",
                messages = new[] { new { role = "user", content = "Hello" } },
                temperature = 0.7
            })
        };
        request.Headers.Add("X-Internal-API-Key", "invalid-key-xyz");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().Be("Invalid Credentials");
        problemDetails.Extensions.Should().ContainKey("traceId");
    }

    [Fact]
    public async Task ChatComplete_WithEmptyApiKey_Returns401()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Post, "/v1/chat/complete")
        {
            Content = JsonContent.Create(new
            {
                sessionId = "test-session",
                messages = new[] { new { role = "user", content = "Hello" } }
            })
        };
        request.Headers.Add("X-Internal-API-Key", "");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
