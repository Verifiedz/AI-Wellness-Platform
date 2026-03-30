namespace AIWellness.Auth.Exceptions;

public sealed class AuthConflictException : AuthException
{
  public AuthConflictException(string errorCode, string internalMessage)
    : base(errorCode, internalMessage) { }
}
