using CommunityService.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CommunityService.Tests.Middleware;

public class GatewayAuthMiddlewareTests
{
    private const string ValidKey = "test-secret-key-12345";

    private static GatewayAuthMiddleware CreateMiddleware(
        RequestDelegate next,
        ILogger<GatewayAuthMiddleware>? logger = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Gateway:SharedSecret"] = ValidKey
            })
            .Build();

        return new GatewayAuthMiddleware(
            next,
            config,
            logger ?? Mock.Of<ILogger<GatewayAuthMiddleware>>());
    }

    [Fact]
    public async Task GatewayAuth_Returns401_WhenHeaderMissing()
    {
        // Arrange: request with no X-Internal-Api-Key header
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/community/posts";
        context.Response.Body = new MemoryStream();
        var nextCalled = false;
        var middleware = CreateMiddleware(_ => { nextCalled = true; return Task.CompletedTask; });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(401, context.Response.StatusCode);
        Assert.False(nextCalled);
    }

    [Fact]
    public async Task GatewayAuth_Returns401_WhenHeaderInvalid()
    {
        // Arrange: request with wrong key
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/community/posts";
        context.Request.Headers["X-Internal-Api-Key"] = "wrong-key";
        context.Response.Body = new MemoryStream();
        var nextCalled = false;
        var middleware = CreateMiddleware(_ => { nextCalled = true; return Task.CompletedTask; });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(401, context.Response.StatusCode);
        Assert.False(nextCalled);
    }

    [Fact]
    public async Task GatewayAuth_PassesThrough_WhenHeaderValid()
    {
        // Arrange: request with correct key
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/community/posts";
        context.Request.Headers["X-Internal-Api-Key"] = ValidKey;
        var nextCalled = false;
        var middleware = CreateMiddleware(_ => { nextCalled = true; return Task.CompletedTask; });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
    }

    [Fact]
    public async Task GatewayAuth_SkipsHealth_WithoutKey()
    {
        // Arrange: /health request with no key
        var context = new DefaultHttpContext();
        context.Request.Path = "/health";
        var nextCalled = false;
        var middleware = CreateMiddleware(_ => { nextCalled = true; return Task.CompletedTask; });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
    }
}
