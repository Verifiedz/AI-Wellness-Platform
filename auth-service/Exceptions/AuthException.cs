namespace AIWellness.Auth.Exceptions;

public abstract class AuthException : Exception
{
  public string ErrorCode { get; }

  protected AuthException(string errorCode, string internalMessage)
    : base(internalMessage)
  {
    ErrorCode = errorCode;
  }
}
