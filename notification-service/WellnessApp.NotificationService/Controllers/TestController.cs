using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WellnessApp.NotificationService.Services;

namespace WellnessApp.NotificationService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        private readonly WellnessTipService _tipService;

        public TestController(WellnessTipService tipService)
        {
            _tipService = tipService;
        }

        [HttpGet("random-tip")]
        public async Task<IActionResult> GetRandomTip()
        {
            var tip = await _tipService.GetRandomTipAsync();
            return Ok(new { tip });
        }
    }
}
