namespace CommunityService.Services;

using Npgsql;
using NpgsqlTypes;
using CommunityService.Models.Responses;

public sealed class CommunityDbService
{
    private readonly string _connectionString;
    private readonly ILogger<CommunityDbService> _logger;

    private static readonly string[] AnimalNames =
    [
        "Brave Owl", "Calm Fox", "Gentle Bear", "Kind Dolphin", "Wise Eagle",
        "Warm Otter", "Strong Elk", "Quiet Deer", "Bold Hawk", "Soft Rabbit",
        "Swift Falcon", "Deep Whale", "Bright Heron", "Steady Wolf", "Free Crane",
        "Cool Lynx", "Keen Raven", "True Osprey", "Clear Finch", "Safe Moose"
    ];

    public CommunityDbService(IConfiguration config, ILogger<CommunityDbService> logger)
    {
        _connectionString = config.GetConnectionString("CommunityDatabase")
            ?? throw new InvalidOperationException("CommunityDatabase connection string is not configured");
        _logger = logger;
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

    public async Task<List<PostResponse>> GetPostsAsync(string slug, Guid currentUserId, int limit, int offset)
    {
        await using var conn = await OpenAsync();
        const string sql = @"
            SELECT p.id, p.group_id, p.anonymous_name,
                   COALESCE((SELECT avatar_seed FROM anonymous_identities WHERE user_id = p.user_id AND group_id = p.group_id), 0) AS avatar_seed,
                   p.content, p.parent_id, p.created_at,
                   (SELECT COUNT(*) FROM posts WHERE parent_id = p.id AND NOT is_hidden) AS reply_count
            FROM posts p
            JOIN support_groups g ON g.id = p.group_id
            WHERE g.slug = @slug AND p.parent_id IS NULL AND NOT p.is_hidden
            ORDER BY p.created_at DESC
            LIMIT @limit OFFSET @offset";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("slug", slug);
        cmd.Parameters.AddWithValue("limit", limit);
        cmd.Parameters.AddWithValue("offset", offset);

        await using var reader = await cmd.ExecuteReaderAsync();
        var posts = new List<PostResponse>();
        var postIds = new List<Guid>();

        while (await reader.ReadAsync())
        {
            var postId = reader.GetGuid(0);
            postIds.Add(postId);
            posts.Add(new PostResponse(
                postId, reader.GetGuid(1), reader.GetString(2), reader.GetInt32(3),
                reader.GetString(4),
                reader.IsDBNull(5) ? null : reader.GetGuid(5),
                (int)reader.GetInt64(7),
                new Dictionary<string, int>(), [],
                reader.GetDateTime(6)));
        }

        if (postIds.Count == 0) return posts;

        // Fetch reactions
        var reactionMap = await GetReactionCountsAsync(conn, postIds);
        var userReactions = await GetUserReactionsAsync(conn, postIds, currentUserId);

        return posts.Select(p => p with
        {
            Reactions = reactionMap.GetValueOrDefault(p.Id, new Dictionary<string, int>()),
            UserReactions = userReactions.GetValueOrDefault(p.Id, [])
        }).ToList();
    }

    private static async Task<Dictionary<Guid, Dictionary<string, int>>> GetReactionCountsAsync(
        NpgsqlConnection conn, List<Guid> postIds)
    {
        const string sql = @"
            SELECT post_id, reaction_type, COUNT(*) FROM reactions
            WHERE post_id = ANY(@ids) GROUP BY post_id, reaction_type";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.Add(new NpgsqlParameter("ids", NpgsqlDbType.Array | NpgsqlDbType.Uuid) { Value = postIds.ToArray() });

        var map = new Dictionary<Guid, Dictionary<string, int>>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var postId = reader.GetGuid(0);
            if (!map.ContainsKey(postId)) map[postId] = new Dictionary<string, int>();
            map[postId][reader.GetString(1)] = (int)reader.GetInt64(2);
        }
        return map;
    }

    private static async Task<Dictionary<Guid, string[]>> GetUserReactionsAsync(
        NpgsqlConnection conn, List<Guid> postIds, Guid userId)
    {
        const string sql = @"
            SELECT post_id, reaction_type FROM reactions
            WHERE post_id = ANY(@ids) AND user_id = @userId";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.Add(new NpgsqlParameter("ids", NpgsqlDbType.Array | NpgsqlDbType.Uuid) { Value = postIds.ToArray() });
        cmd.Parameters.AddWithValue("userId", userId);

        var map = new Dictionary<Guid, List<string>>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var postId = reader.GetGuid(0);
            if (!map.ContainsKey(postId)) map[postId] = [];
            map[postId].Add(reader.GetString(1));
        }
        return map.ToDictionary(kv => kv.Key, kv => kv.Value.ToArray());
    }

    public async Task<PostResponse> CreatePostAsync(string slug, Guid userId, string content)
    {
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
        cmd.Parameters.AddWithValue("content", content);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        return new PostResponse(
            reader.GetGuid(0), groupId, anonName, avatarSeed,
            content, null, 0, new Dictionary<string, int>(), [],
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
        const string sql = @"
            INSERT INTO reports (post_id, reporter_id, reason) VALUES (@postId, @reporterId, @reason)";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("postId", postId);
        cmd.Parameters.AddWithValue("reporterId", reporterId);
        cmd.Parameters.AddWithValue("reason", reason);
        await cmd.ExecuteNonQueryAsync();
    }
}
