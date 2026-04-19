using Microsoft.AspNetCore.DataProtection;

namespace ChatService.Services;

/// <summary>
/// Transparent field-level encryption for chat message bodies.
///
/// Every stored plaintext is written as <c>v1:{base64 ciphertext}</c>. On
/// read we detect the prefix and reverse the transformation; rows without a
/// prefix (legacy data written before the rollout) are returned as-is so the
/// switch can happen without a data migration.
/// </summary>
public interface IFieldProtector
{
    string? Protect(string? plaintext);
    string? Unprotect(string? ciphertext);
}

public sealed class FieldProtector : IFieldProtector
{
    private const string Purpose = "sakina.chat.fields.v1";
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
            return ciphertext;
        }

        try
        {
            return _protector.Unprotect(ciphertext[Prefix.Length..]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to unprotect chat field; returning opaque marker");
            return "[encrypted content unavailable]";
        }
    }
}
