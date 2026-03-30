namespace CommunityService.Tests.Services;

using Ganss.Xss;
using Xunit;

public class CommunityDbServiceSanitizationTests
{
    [Theory]
    [InlineData("<script>alert('xss')</script>", "")]
    [InlineData("Plain text", "Plain text")]
    [InlineData("<img src=x onerror=alert(1)>", "")]
    public void Sanitizer_StripsAllHtmlTags(string input, string expected)
    {
        var sanitizer = new HtmlSanitizer();
        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedAttributes.Clear();

        var result = sanitizer.Sanitize(input);

        Assert.Equal(expected, result);
    }
}
