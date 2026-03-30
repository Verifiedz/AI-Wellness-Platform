using AIWellness.Auth.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace AIWellness.Auth.Tests.Controllers;

public class AuthControllerTests
{
  // SEC-06: Verify GET /api/auth/user-info/{email} endpoint has been removed
  [Fact]
  public void UserInfoByEmail_EndpointRemoved()
  {
    // Reflect on AuthController to verify no action method carries
    // an [HttpGet("user-info/{email}")] attribute. This ensures the
    // unauthenticated-by-design lookup surface is permanently gone.
    var controllerMethods = typeof(AuthController).GetMethods();

    foreach (var method in controllerMethods)
    {
      var httpGetAttrs = method.GetCustomAttributes(typeof(HttpGetAttribute), inherit: false);
      foreach (HttpGetAttribute attr in httpGetAttrs)
      {
        Assert.False(
          attr.Template?.Contains("user-info/{email}", StringComparison.OrdinalIgnoreCase) == true,
          $"Method '{method.Name}' still has route 'user-info/{{email}}' -- SEC-06 endpoint was not removed");
      }
    }
  }
}
