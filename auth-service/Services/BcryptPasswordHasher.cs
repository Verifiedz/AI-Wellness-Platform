namespace AIWellness.Auth.Services;

public sealed class BcryptPasswordHasher : Abstractions.IPasswordHasher
{
    public string HashPassword(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password);

    public bool VerifyHashedPassword(string hashedPassword, string providedPassword) =>
        BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword);
}
