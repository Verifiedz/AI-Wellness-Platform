namespace AIWellness.Auth.Exceptions;

public sealed class AuthNotFoundException : AuthException
{
  public AuthNotFoundException(string errorCode, string internalMessage)
    : base(errorCode, internalMessage) { }
}
