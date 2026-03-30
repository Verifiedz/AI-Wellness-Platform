namespace AIWellness.Auth.Exceptions;

public sealed class AuthSecurityException : AuthException
{
  public AuthSecurityException(string errorCode, string internalMessage)
    : base(errorCode, internalMessage) { }
}
