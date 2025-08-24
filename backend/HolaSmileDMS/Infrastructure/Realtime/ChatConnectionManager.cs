using System.Collections.Concurrent;

public static class ChatConnectionManager
{
    private static readonly ConcurrentDictionary<string, string> _connections = new();

    public static void AddConnection(string userId, string connectionId)
    {
        _connections[userId] = connectionId;
        Console.WriteLine($"✅ Added connection: {userId} -> {connectionId}");
    }

    public static void RemoveConnection(string userId)
    {
        _connections.TryRemove(userId, out _);
    }

    public static string? GetConnectionId(string userId)
    {
        return _connections.TryGetValue(userId, out var connectionId) ? connectionId : null;
    }

    public static IEnumerable<string> GetConnections(string userId)
    {
        var connectionId = GetConnectionId(userId);
        return connectionId != null ? new[] { connectionId } : Array.Empty<string>();
    }
}