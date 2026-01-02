namespace ChatService.Interfaces;

public interface ISessionService{


  public Task CreateSession();

  public Task StartSession(); 
}
