namespace AIWellness.Auth.Exceptions;

public sealed class AuthValidationException : AuthException
{
  public AuthValidationException(string errorCode, string internalMessage)
    : base(errorCode, internalMessage) { }
}
