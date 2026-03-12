using Microsoft.AspNetCore.Mvc;
using ChatService.Interfaces;
using Microsoft.AspNetCore.Authorization;
using ChatService.DTOs;
using ChatService.entities;
using System.Security.Claims;

[Route("chatService/api")]
[ApiController]
public class ChatController : ControllerBase
{
  private readonly IChatService _chatService;
  private readonly ISessionService _sessionService;
  private readonly ILogger<ChatController> _logger;

  public ChatController(IChatService chatService, ISessionService sessionService, ILogger<ChatController> logger)
  {
    _chatService = chatService;
    _sessionService = sessionService;
    _logger = logger;
  }

  [Authorize]
  [HttpPost("chatRequest")]
  public async Task<IActionResult> SendChat([FromBody] ChatRequest chatRequest)
  {
    if (chatRequest == null)
    {
      return BadRequest("ChatRequest was not found, null response");
    }

    if (!TryResolveCurrentUserId(out var currentUserId, out var errorResult))
    {
      return errorResult!;
    }

    try
    {
      var normalizedRequest = chatRequest with { chatUserId = currentUserId };
      var chatResponse = await _chatService.SendChatMessageAsync(normalizedRequest);
      return Ok(chatResponse);
    }
    catch (ArgumentException e)
    {
      return BadRequest(e.Message); 
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error: {Message}", ex.Message);
      return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while processing the chat request.");
    }
  }

  [Authorize]
  [HttpGet("chat/{sessionId}")]
  public async Task<IActionResult> GetSessionChats([FromRoute] Guid sessionId)
  {
    if (!TryResolveCurrentUserId(out var currentUserId, out var errorResult))
    {
      return errorResult!;
    }

    try
    {
      var chatCollectionBySession = await _chatService.GetChatsbySessionAsync(sessionId, currentUserId);
      return Ok(chatCollectionBySession ?? new List<Chat>());
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ex.Message);
    }
    catch (ArgumentException ex)
    {
      return BadRequest(ex.Message);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error: {Message}", ex.Message);
      return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving chats.");
    }
  }

  [Authorize]
  [HttpGet("sessions")]
  public async Task<IActionResult> GetSessions()
  {
    if (!TryResolveCurrentUserId(out var currentUserId, out var errorResult))
    {
      return errorResult!;
    }

    try
    {
      var sessions = await _sessionService.GetSessionsByUserAsync(currentUserId);
      return Ok(sessions ?? new List<ChatSession>());
    }
    catch (ArgumentException ex)
    {
      return BadRequest(ex.Message);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error: {Message}", ex.Message);
      return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving sessions.");
    }
  }

  [Authorize]
  [HttpPatch("sessions/{sessionId}/bookmark")]
  public async Task<IActionResult> BookmarkSession([FromRoute] Guid sessionId, [FromBody] BookmarkRequest request)
  {
    if (!TryResolveCurrentUserId(out var currentUserId, out var errorResult))
    {
      return errorResult!;
    }

    if (request == null)
    {
      return BadRequest("Bookmark request was not provided.");
    }

    try
    {
      await _sessionService.BookmarkSessionAsync(sessionId, currentUserId, request.isBookmarked);
      return NoContent();
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(ex.Message);
    }
    catch (ArgumentException ex)
    {
      return BadRequest(ex.Message);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error: {Message}", ex.Message);
      return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while updating the bookmark.");
    }
  }

  private bool TryResolveCurrentUserId(out Guid userId, out IActionResult? errorResult)
  {
    userId = Guid.Empty;
    errorResult = null;

    var rawUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
    if (string.IsNullOrWhiteSpace(rawUserId) || !Guid.TryParse(rawUserId, out userId))
    {
      errorResult = Unauthorized("User identity is invalid or missing.");
      return false;
    }

    return true;
  }
}
