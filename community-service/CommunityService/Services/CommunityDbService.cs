namespace CommunityService.Services;

using Npgsql;
using CommunityService.Models.Responses;

public sealed class CommunityDbService : ICommunityDbService
{
    private readonly string _connectionString;
    private readonly ILogger<CommunityDbService> _logger;
    private readonly Ganss.Xss.HtmlSanitizer _sanitizer;

    private static readonly string[] AnimalNames =
    [
        "Brave Owl", "Calm Fox", "Gentle Bear", "Kind Dolphin", "Wise Eagle",
        "Warm Otter", "Strong Elk", "Quiet Deer", "Bold Hawk", "Soft Rabbit",
        "Swift Falcon", "Deep Whale", "Bright Heron", "Steady Wolf", "Free Crane",
        "Cool Lynx", "Keen Raven", "True Osprey", "Clear Finch", "Safe Moose"
    ];

    public CommunityDbService(IConfiguration config, ILogger<CommunityDbService> logger, Ganss.Xss.HtmlSanitizer sanitizer)
    {
        _connectionString = config.GetConnectionString("CommunityDatabase")
            ?? throw new InvalidOperationException("CommunityDatabase connection string is not configured");
        _logger = logger;
        _sanitizer = sanitizer;
    }

    private async Task<NpgsqlConnection> OpenAsync()
    {
        var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();
        return conn;
    }

    public async Task<List<GroupResponse>> GetGroupsAsync()
    {
        await using var conn = await OpenAsync();
        const string sql = @"
            SELECT g.id, g.name, g.slug, g.description, g.icon,
                   (SELECT COUNT(DISTINCT user_id) FROM posts WHERE group_id = g.id) AS member_count,
                   (SELECT COUNT(*) FROM posts WHERE group_id = g.id AND NOT is_hidden) AS post_count
            FROM support_groups g ORDER BY g.name";

        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        var results = new List<GroupResponse>();
        while (await reader.ReadAsync())
        {
            results.Add(new GroupResponse(
                reader.GetGuid(0), reader.GetString(1), reader.GetString(2),
                reader.GetString(3), reader.GetString(4),
                (int)reader.GetInt64(5), (int)reader.GetInt64(6)));
        }
        return results;
    }

    private const string GetPostsSql = @"
        WITH blocked AS (
            SELECT blocked_id AS uid FROM community_blocks WHERE blocker_id = @currentUserId
        ),
        post_data AS (
            SELECT p.id, p.group_id, p.anonymous_name,
                   COALESCE((SELECT avatar_seed FROM anonymous_identities WHERE user_id = p.user_id AND group_id = p.group_id), 0) AS avatar_seed,
                   p.content, p.parent_id, p.created_at,
                   (SELECT COUNT(*) FROM posts r
                    WHERE r.parent_id = p.id
                      AND NOT r.is_hidden
                      AND r.user_id NOT IN (SELECT uid FROM blocked)) AS reply_count
            FROM posts p
            JOIN support_groups g ON g.id = p.group_id
            WHERE g.slug = @slug
              AND p.parent_id IS NULL
              AND NOT p.is_hidden
              AND p.user_id NOT IN (SELECT uid FROM blocked)
            ORDER BY p.created_at DESC
            LIMIT @limit OFFSET @offset
        ),
        reaction_counts AS (
            SELECT r.post_id, r.reaction_type, COUNT(*)::int AS cnt
            FROM reactions r
            WHERE r.post_id IN (SELECT id FROM post_data)
            GROUP BY r.post_id, r.reaction_type
        ),
        reaction_agg AS (
            SELECT post_id,
                   json_object_agg(reaction_type, cnt) AS reactions
            FROM reaction_counts
            GROUP BY post_id
        ),
        user_reaction_agg AS (
            SELECT r.post_id,
                   array_agg(r.reaction_type) AS user_reactions
            FROM reactions r
            WHERE r.post_id IN (SELECT id FROM post_data)
              AND r.user_id = @currentUserId
            GROUP BY r.post_id
        )
        SELECT pd.id, pd.group_id, pd.anonymous_name, pd.avatar_seed,
               pd.content, pd.parent_id, pd.created_at, pd.reply_count,
               COALESCE(ra.reactions, '{}'::json) AS reactions,
               COALESCE(ura.user_reactions, ARRAY[]::varchar[]) AS user_reactions
        FROM post_data pd
        LEFT JOIN reaction_agg ra ON ra.post_id = pd.id
        LEFT JOIN user_reaction_agg ura ON ura.post_id = pd.id
        ORDER BY pd.created_at DESC";

    public async Task<List<PostResponse>> GetPostsAsync(string slug, Guid currentUserId, int limit, int offset)
    {
        await using var conn = await OpenAsync();
        await using var cmd = new NpgsqlCommand(GetPostsSql, conn);
        cmd.Parameters.AddWithValue("slug", slug);
        cmd.Parameters.AddWithValue("limit", limit);
        cmd.Parameters.AddWithValue("offset", offset);
        cmd.Parameters.AddWithValue("currentUserId", currentUserId);

        await using var reader = await cmd.ExecuteReaderAsync();
        var posts = new List<PostResponse>();

        while (await reader.ReadAsync())
        {
            var reactionsJson = reader.GetString(8);
            var reactions = string.IsNullOrWhiteSpace(reactionsJson) || reactionsJson == "{}"
                ? new Dictionary<string, int>()
                : System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, int>>(reactionsJson)
                  ?? new Dictionary<string, int>();

            var userReactions = reader.IsDBNull(9)
                ? Array.Empty<string>()
                : reader.GetFieldValue<string[]>(9);

            posts.Add(new PostResponse(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.GetString(2),
                reader.GetInt32(3),
                reader.GetString(4),
                reader.IsDBNull(5) ? null : reader.GetGuid(5),
                (int)reader.GetInt64(7),
                reactions,
                userReactions,
                reader.GetDateTime(6)));
        }

        return posts;
    }

    public async Task<PostResponse> CreatePostAsync(string slug, Guid userId, string content)
    {
        var safeContent = _sanitizer.Sanitize(content);

        await using var conn = await OpenAsync();

        // Get or create anonymous identity
        var (anonName, avatarSeed) = await GetOrCreateIdentityAsync(conn, slug, userId);

        // Get group ID
        await using var groupCmd = new NpgsqlCommand("SELECT id FROM support_groups WHERE slug = @slug", conn);
        groupCmd.Parameters.AddWithValue("slug", slug);
        var groupId = (Guid)(await groupCmd.ExecuteScalarAsync()
            ?? throw new KeyNotFoundException($"Group '{slug}' not found"));

        // Insert post
        const string sql = @"
            INSERT INTO posts (group_id, user_id, anonymous_name, content)
            VALUES (@groupId, @userId, @anonName, @content)
            RETURNING id, created_at";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("groupId", groupId);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("anonName", anonName);
        cmd.Parameters.AddWithValue("content", safeContent);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        return new PostResponse(
            reader.GetGuid(0), groupId, anonName, avatarSeed,
            safeContent, null, 0, new Dictionary<string, int>(), [],
            reader.GetDateTime(1));
    }

    private async Task<(string Name, int Seed)> GetOrCreateIdentityAsync(
        NpgsqlConnection conn, string slug, Guid userId)
    {
        // Check existing
        const string selectSql = @"
            SELECT ai.anonymous_name, ai.avatar_seed FROM anonymous_identities ai
            JOIN support_groups g ON g.id = ai.group_id
            WHERE ai.user_id = @userId AND g.slug = @slug";

        await using var selectCmd = new NpgsqlCommand(selectSql, conn);
        selectCmd.Parameters.AddWithValue("userId", userId);
        selectCmd.Parameters.AddWithValue("slug", slug);

        await using var reader = await selectCmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return (reader.GetString(0), reader.GetInt32(1));
        }
        await reader.CloseAsync();

        // Create new
        var seed = Math.Abs(userId.GetHashCode() ^ slug.GetHashCode()) % 10000;
        var name = AnimalNames[seed % AnimalNames.Length];

        const string insertSql = @"
            INSERT INTO anonymous_identities (user_id, group_id, anonymous_name, avatar_seed)
            SELECT @userId, g.id, @name, @seed FROM support_groups g WHERE g.slug = @slug
            ON CONFLICT (user_id, group_id) DO NOTHING";

        await using var insertCmd = new NpgsqlCommand(insertSql, conn);
        insertCmd.Parameters.AddWithValue("userId", userId);
        insertCmd.Parameters.AddWithValue("slug", slug);
        insertCmd.Parameters.AddWithValue("name", name);
        insertCmd.Parameters.AddWithValue("seed", seed);
        await insertCmd.ExecuteNonQueryAsync();

        return (name, seed);
    }

    public async Task AddReactionAsync(Guid postId, Guid userId, string reactionType)
    {
        await using var conn = await OpenAsync();
        const string sql = @"
            INSERT INTO reactions (post_id, user_id, reaction_type)
            VALUES (@postId, @userId, @type)
            ON CONFLICT (post_id, user_id, reaction_type) DO NOTHING";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("postId", postId);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("type", reactionType);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task RemoveReactionAsync(Guid postId, Guid userId, string reactionType)
    {
        await using var conn = await OpenAsync();
        const string sql = @"
            DELETE FROM reactions WHERE post_id = @postId AND user_id = @userId AND reaction_type = @type";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("postId", postId);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("type", reactionType);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task ReportPostAsync(Guid postId, Guid reporterId, string reason)
    {
        await using var conn = await OpenAsync();
        // Unique index on (reporter_id, post_id) keeps repeat taps idempotent.
        const string sql = @"
            INSERT INTO reports (post_id, reporter_id, reason)
            VALUES (@postId, @reporterId, @reason)
            ON CONFLICT (reporter_id, post_id) DO NOTHING";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("postId", postId);
        cmd.Parameters.AddWithValue("reporterId", reporterId);
        cmd.Parameters.AddWithValue("reason", reason);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task BlockUserAsync(Guid blockerId, Guid blockedId, string? reason = null)
    {
        if (blockerId == blockedId)
        {
            throw new InvalidOperationException("A user cannot block themselves");
        }

        await using var conn = await OpenAsync();
        const string sql = @"
            INSERT INTO community_blocks (blocker_id, blocked_id, reason)
            VALUES (@blockerId, @blockedId, @reason)
            ON CONFLICT (blocker_id, blocked_id) DO NOTHING";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("blockerId", blockerId);
        cmd.Parameters.AddWithValue("blockedId", blockedId);
        cmd.Parameters.AddWithValue("reason", (object?)reason ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();

        _logger.LogInformation("User {Blocker} blocked user {Blocked}", blockerId, blockedId);
    }

    public async Task UnblockUserAsync(Guid blockerId, Guid blockedId)
    {
        await using var conn = await OpenAsync();
        await using var cmd = new NpgsqlCommand(
            "DELETE FROM community_blocks WHERE blocker_id = @blockerId AND blocked_id = @blockedId",
            conn);
        cmd.Parameters.AddWithValue("blockerId", blockerId);
        cmd.Parameters.AddWithValue("blockedId", blockedId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<IReadOnlyList<BlockedUserResponse>> GetBlockedUsersAsync(Guid blockerId)
    {
        await using var conn = await OpenAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT blocked_id, created_at, reason FROM community_blocks WHERE blocker_id = @blockerId ORDER BY created_at DESC",
            conn);
        cmd.Parameters.AddWithValue("blockerId", blockerId);

        await using var reader = await cmd.ExecuteReaderAsync();
        var results = new List<BlockedUserResponse>();
        while (await reader.ReadAsync())
        {
            results.Add(new BlockedUserResponse(
                reader.GetGuid(0),
                reader.GetDateTime(1),
                reader.IsDBNull(2) ? null : reader.GetString(2)));
        }
        return results;
    }

    public async Task<Guid?> BlockUserByPostAsync(Guid blockerId, Guid postId, string? reason = null)
    {
        await using var conn = await OpenAsync();

        await using var lookup = new NpgsqlCommand("SELECT user_id FROM posts WHERE id = @postId", conn);
        lookup.Parameters.AddWithValue("postId", postId);
        var result = await lookup.ExecuteScalarAsync();
        if (result is null || result is DBNull) return null;

        var blockedId = (Guid)result;
        if (blockedId == blockerId) return null; // ignore self-block

        await BlockUserAsync(blockerId, blockedId, reason);
        return blockedId;
    }

    public async Task DeleteUserDataAsync(Guid userId)
    {
        await using var conn = await OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            // Reactions first (FK to posts, not cascade on user).
            await ExecuteAsync(conn, tx, "DELETE FROM reactions WHERE user_id = @userId", userId);
            // Reports filed by this user.
            await ExecuteAsync(conn, tx, "DELETE FROM reports WHERE reporter_id = @userId", userId);
            // Soft-remove top-level posts by blanking content so thread history does not break
            // for other users' replies. Replies by this user are fully deleted.
            await ExecuteAsync(conn, tx,
                @"UPDATE posts
                  SET content = '[deleted]', is_hidden = TRUE, anonymous_name = 'Former User'
                  WHERE user_id = @userId AND parent_id IS NULL", userId);
            await ExecuteAsync(conn, tx,
                "DELETE FROM posts WHERE user_id = @userId AND parent_id IS NOT NULL", userId);
            // Remove reports targeting the user's deleted replies (best-effort).
            await ExecuteAsync(conn, tx,
                "DELETE FROM reports WHERE post_id NOT IN (SELECT id FROM posts)", userId);
            // Anonymous identities last.
            await ExecuteAsync(conn, tx, "DELETE FROM anonymous_identities WHERE user_id = @userId", userId);
            // Any blocks involving this user.
            await ExecuteAsync(conn, tx,
                "DELETE FROM community_blocks WHERE blocker_id = @userId OR blocked_id = @userId",
                userId, ignoreMissingTable: true);

            await tx.CommitAsync();
            _logger.LogInformation("Deleted community data for user {UserId}", userId);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    private static async Task ExecuteAsync(
        NpgsqlConnection conn,
        NpgsqlTransaction tx,
        string sql,
        Guid userId,
        bool ignoreMissingTable = false)
    {
        try
        {
            await using var cmd = new NpgsqlCommand(sql, conn, tx);
            cmd.Parameters.AddWithValue("userId", userId);
            await cmd.ExecuteNonQueryAsync();
        }
        catch (PostgresException ex) when (ignoreMissingTable && ex.SqlState == "42P01")
        {
            // Table does not exist yet (community_blocks is added in Issue 3). Safe to skip.
        }
    }
}
