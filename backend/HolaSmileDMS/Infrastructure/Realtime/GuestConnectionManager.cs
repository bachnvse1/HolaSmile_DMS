namespace Infrastructure.Realtime;

public static partial class GuestConnectionManager
{
    private static readonly Dictionary<string, HashSet<string>> _connections = new();

    public static void AddConnection(string userId, string connectionId)
    {
        lock (_connections)
        {
            if (!_connections.ContainsKey(userId))
                _connections[userId] = new HashSet<string>();

            _connections[userId].Add(connectionId);
        }
    }

    public static void RemoveConnection(string userId, string connectionId)
    {
        lock (_connections)
        {
            if (_connections.ContainsKey(userId))
            {
                _connections[userId].Remove(connectionId);
                if (_connections[userId].Count == 0)
                    _connections.Remove(userId);
            }
        }
    }

    public static IEnumerable<string> GetConnections(string userId)
    {
        if (_connections.TryGetValue(userId, out var conns))
            return conns;

        return Enumerable.Empty<string>();
    }
}