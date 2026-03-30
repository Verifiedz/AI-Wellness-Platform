namespace AuthService.Tests.Middleware;

using System.IO;

public class RateLimitingOrderTests
{
    [Fact]
    public void MiddlewareOrder_CorsRegisteredBeforeRateLimiter()
    {
        // Read Program.cs source to verify middleware registration order
        var programPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "Program.cs");
        var source = File.ReadAllText(programPath);

        var corsIndex = source.IndexOf("UseCors");
        var rateLimitIndex = source.IndexOf("UseRateLimiter");

        Assert.True(corsIndex > 0, "UseCors not found in Program.cs");
        Assert.True(rateLimitIndex > 0, "UseRateLimiter not found in Program.cs");
        Assert.True(corsIndex < rateLimitIndex,
            $"UseCors (index {corsIndex}) must appear before UseRateLimiter (index {rateLimitIndex}) in the middleware pipeline");
    }

    [Fact]
    public void MiddlewareOrder_AuthenticationRegisteredBeforeRateLimiter()
    {
        var programPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "Program.cs");
        var source = File.ReadAllText(programPath);

        var authIndex = source.IndexOf("UseAuthentication");
        var rateLimitIndex = source.IndexOf("UseRateLimiter");

        Assert.True(authIndex > 0, "UseAuthentication not found in Program.cs");
        Assert.True(rateLimitIndex > 0, "UseRateLimiter not found in Program.cs");
        Assert.True(authIndex < rateLimitIndex,
            $"UseAuthentication (index {authIndex}) must appear before UseRateLimiter (index {rateLimitIndex})");
    }
}
