namespace Infrastructure.Realtime;

public static class ChatConnectionManager
{
    private static readonly Dictionary<string, string> _userConnections = new();

    public static void AddConnection(string userId, string connectionId)
        => _userConnections[userId] = connectionId;

    public static string? GetConnectionId(string userId)
        => _userConnections.TryGetValue(userId, out var connId) ? connId : null;

    public static void RemoveConnection(string userId)
        => _userConnections.Remove(userId);
}