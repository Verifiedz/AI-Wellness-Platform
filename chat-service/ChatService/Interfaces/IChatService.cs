namespace ChatService.Interfaces;
using ChatService.DTOs;
public interface IChatService
{
  /* workflow for chatservice(when) should be abstract to other services their logic should not effect the when
 * Create and establish a connection via the session service
 * then recieve request from the api gateway wit chatRequest record 
 * create an api call to the wrapper in the format of chat response 
 * interact with chat provider layer by invoking CRUD operations storing created chats 
 * collecting a list of chats
 * book marking chats invoking the filter service
 * 
 * 
    public methods will be user focused what the user is trying to do
Note that shared dependencies do not mean shared entry point if each use case requires common interactions can have private internal methods
    do we want a single entry or have explicit use cases
    user(authenticated) -> apiGateway will be given a request-> Controller -> service

        options:
            - type in a chat aka chat request will come 
            - on startup they will need a list of all chats to display on UI
            - A session must be established for them to access the service check to see the availability of that session is pre conditional requirement
            - A filter could be applied must give them the correct list of chats 
            - A chat could be archived removed, created, etc
            - then must give a chat response when given a chatrequest

 * 
 * 
 *  methods for service
 *  
 *  Public Methods
 *  
 *  RequestChatResponse()
 *  
 *  ModifyChats()
 *  
 *  
 *  
 *  
 *  internal methods
    private ValidateorRequestSession()
    private RequestFilter()
    will create hashset to use a particular provider layer command

 */
 public Task<ChatResponse> SendChatMessageAsync(ChatRequest chatRequest);
 
 public Task<IReadOnlyList<Chat>> GetChatsbySessionAsync(Guid sessionID, Guid UserId);

 public void BookmarkChat(Guid sessionID); }
