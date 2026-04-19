using Microsoft.AspNetCore.DataProtection;

namespace JournalService.Api.Services;

/// <summary>
/// Transparent field-level encryption for journal-entry content.
///
/// Wraps ASP.NET Core Data Protection so every stored plaintext is written
/// as <c>v1:{base64 ciphertext}</c>. On read we detect the prefix and reverse
/// the transformation; ciphertext that is absent or malformed (legacy rows,
/// developer inserts) is returned verbatim so the encryption rollout can be
/// done lazily without a migration. New writes are always encrypted.
///
/// Keys are persisted via <c>AddDataProtection</c> in Program.cs — in
/// production they go to Redis so every replica shares the same ring, and in
/// local dev they go to <c>./keys</c> so dev data remains readable across
/// restarts.
/// </summary>
public interface IFieldProtector
{
    string? Protect(string? plaintext);
    string? Unprotect(string? ciphertext);
}

public sealed class FieldProtector : IFieldProtector
{
    // Purpose string is part of the key context. If we ever want to rotate
    // which fields share a key ring we can bump the version here.
    private const string Purpose = "sakina.journal.fields.v1";
    private const string Prefix = "v1:";

    private readonly IDataProtector _protector;
    private readonly ILogger<FieldProtector> _logger;

    public FieldProtector(IDataProtectionProvider provider, ILogger<FieldProtector> logger)
    {
        _protector = provider.CreateProtector(Purpose);
        _logger = logger;
    }

    public string? Protect(string? plaintext)
    {
        if (plaintext is null) return null;
        if (plaintext.Length == 0) return plaintext;
        return Prefix + _protector.Protect(plaintext);
    }

    public string? Unprotect(string? ciphertext)
    {
        if (ciphertext is null) return null;
        if (!ciphertext.StartsWith(Prefix, StringComparison.Ordinal))
        {
            // Legacy plaintext row written before field protection was enabled.
            // Returning as-is means the rollout can be incremental; new writes
            // go through Protect() and will be prefixed automatically.
            return ciphertext;
        }

        try
        {
            return _protector.Unprotect(ciphertext[Prefix.Length..]);
        }
        catch (Exception ex)
        {
            // A decryption failure almost always means the key ring was rotated
            // or lost. We log and return the prefixed blob so downstream code
            // can tell the difference between plaintext and unreadable cipher.
            _logger.LogError(ex, "Failed to unprotect journal field; returning opaque marker");
            return "[encrypted content unavailable]";
        }
    }
}
