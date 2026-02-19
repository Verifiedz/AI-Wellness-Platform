namespace ChatService.entities;

public class ChatSession{
 
  public required Guid sessionID {get;set;}
  public Guid UserId {get;set;}
  public bool isBookmarked {get; set;} 
  public DateTime createdDate {get; set;} 
}
