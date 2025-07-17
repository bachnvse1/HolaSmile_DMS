using System.Security.Claims;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Realtime;
using Microsoft.AspNetCore.SignalR;

namespace Infrastructure.Hubs;

public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async System.Threading.Tasks.Task SendMessageToUser(string receiverId, string message)
    {
        var user = Context.User;
        var senderIdClaim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(senderIdClaim))
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }

        var chatMessage = new ChatMessage
        {
            SenderId = senderIdClaim,
            ReceiverId = receiverId,
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        _context.ChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();

        var receiverConnectionId = ChatConnectionManager.GetConnectionId(receiverId);
        if (receiverConnectionId != null)
        {
            await Clients.Client(receiverConnectionId)
                .SendAsync("ReceiveMessage", senderIdClaim, message, receiverId, chatMessage.Timestamp);
        }
        
        await Clients.Caller.SendAsync("ReceiveMessage", senderIdClaim, message, receiverId, chatMessage.Timestamp);
        await Clients.Caller.SendAsync("MessageSent", chatMessage.Id);
    }

    public override System.Threading.Tasks.Task OnConnectedAsync()
    {
        var user = Context.User;
        var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            Console.WriteLine($"User connected: {userId}");
            ChatConnectionManager.AddConnection(userId, Context.ConnectionId);
        }
        return base.OnConnectedAsync();
    }

    public override System.Threading.Tasks.Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            ChatConnectionManager.RemoveConnection(userId);
        }
        return base.OnDisconnectedAsync(exception);
    }
}