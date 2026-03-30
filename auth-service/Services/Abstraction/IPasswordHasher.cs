namespace AIWellness.Auth.Services.Abstractions;

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyHashedPassword(string hashedPassword, string providedPassword);
}
