namespace JournalService.Api.UserContext;

public interface IUserContext
{
    AuthenticatedUser CurrentUser { get; }
}
