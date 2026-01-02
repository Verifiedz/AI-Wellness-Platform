using Microsoft.AspNetCore.Mvc;
using ChatService.Interfaces;
using Microsoft.AspNetCore.Authorization;
using ChatService.DTOs;

[Route("chatService/api")]
[ApiController]
public class ChatController: ControllerBase
{
 private readonly IChatService _chatService;


 public ChatController(IChatService chatService){
  _chatService = chatService;
 }
 [Authorize]
 [HttpPost("chatRequest")]
 public async Task<ActionResult<ChatResponse>> SendChat([FromBody]ChatRequest chatRequest){

   if(chatRequest == null){
     return BadRequest("ChatRequest was not found, null response");
   }
 try{
   var chatResponse = await _chatService.SendChatMessageAsync(chatRequest);
   return Ok(chatResponse);
 }catch(ArgumentException e){
  return BadRequest(e.Message); 
 }
 catch(Exception ex){

   return StatusCode(StatusCodes.Status500InternalServerError,ex.ToString());
 }
 }
 [Authorize]
 [HttpGet("chat/{sessionId}")]
 public async Task<IActionResult> GetSessionChats([FromRoute] Guid sessionId, [FromQuery] Guid userId)
{
    try
    {
        var chatCollectionBySession = await _chatService.GetChatsbySessionAsync(sessionId, userId);

        return Ok(chatCollectionBySession ?? new List<Chat>());
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(ex.Message);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] {ex.Message}");
        return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving chats.");
    }
}

}
