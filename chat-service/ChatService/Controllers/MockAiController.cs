/*using Microsoft.AspNetCore.Mvc;
using ChatService.DTOs;

namespace ChatService.Controllers;

[ApiController]
[Route("mock-api/chat")] 
public class MockAiController : ControllerBase
{
    [HttpPost("ChatResponse")]
    public IActionResult GetMockResponse([FromBody] ChatRequest request)
    {
        Console.WriteLine($"[MOCK SERVER] Received request from User: {request.chatUserId}");
        Console.WriteLine($"[MOCK SERVER] Message: {request.messageRequest}");

        var mockResponse = new ChatResponse
        (
            request.chatUserId,
            $"[MOCK] I received your message: '{request.messageRequest}'. This is a fake response.",
            $"[MOCK] There should be no Context",
            request.sessionId ?? Guid.NewGuid()
        );

        return Ok(mockResponse);
    }
}*/
