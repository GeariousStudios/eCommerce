using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs;

public class MasterPlanHub : Hub
{
    public static ConcurrentDictionary<string, string> UserConnections = new();

    public override Task OnConnectedAsync()
    {
        var username = Context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(username))
        {
            UserConnections[username] = Context.ConnectionId;
        }
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var username = Context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(username))
        {
            UserConnections.TryRemove(username, out _);
        }
        return base.OnDisconnectedAsync(exception);
    }
}
