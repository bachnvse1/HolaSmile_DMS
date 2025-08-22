using System.Security.Claims;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Realtime;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Hubs;

public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
    }

    // Xử lý cả user và guest trong cùng một hub
    public async System.Threading.Tasks.Task SendMessage(string receiverId, string message, bool isGuestSender = false)
    {
        string senderId;
        
        if (isGuestSender)
        {
            // Guest gửi tin nhắn
            var httpContext = Context.GetHttpContext();
            senderId = httpContext?.Request.Query["guestId"].ToString() ?? Context.ConnectionId;
            var guest = await _context.GuestInfos.FirstOrDefaultAsync(x => x.GuestId.ToString() == senderId);
            if (guest == null)
            {
                guest = new GuestInfo
                {
                    GuestId = Guid.Parse(senderId),
                    Name = await GenerateUniqueAnonymousNameAsync(),
                    LastMessageAt = DateTime.Now
                };
                _context.GuestInfos.Add(guest);
            }
            else
            {
                guest.LastMessageAt = DateTime.Now;
            }
        }
        else
        {
            // User/Staff gửi tin nhắn
            var user = Context.User;
            senderId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(senderId))
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }
        }

        var timestamp = DateTime.Now;

        // Lưu tin nhắn
        var chatMessage = new ChatMessage
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Message = message,
            Timestamp = timestamp
        };

        _context.ChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();
        
        // Gửi tới người nhận
        var receiverConnectionId = ChatConnectionManager.GetConnectionId(receiverId);
        if (receiverConnectionId != null)
        {
            await Clients.Client(receiverConnectionId)
                .SendAsync("ReceiveMessage", senderId, message, receiverId, timestamp);
        }

        // Gửi tới người gửi
        await Clients.Caller.SendAsync("ReceiveMessage", senderId, message, receiverId, timestamp);
        await Clients.Caller.SendAsync("MessageSent", chatMessage.Id);
    }

    public override async System.Threading.Tasks.Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var guestId = httpContext?.Request.Query["guestId"].ToString();
        
        if (!string.IsNullOrEmpty(guestId))
        {
            // Guest connection
            Console.WriteLine($"✅ Guest connected: {guestId}, ConnectionId: {Context.ConnectionId}");
            ChatConnectionManager.AddConnection(guestId, Context.ConnectionId);
        }
        else
        {
            // User connection
            var user = Context.User;
            var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                Console.WriteLine($"✅ User connected: {userId}, ConnectionId: {Context.ConnectionId}");
                ChatConnectionManager.AddConnection(userId, Context.ConnectionId);
            }
        }

        await base.OnConnectedAsync();
    }

    public override System.Threading.Tasks.Task OnDisconnectedAsync(Exception? exception)
    {
        var httpContext = Context.GetHttpContext();
        var guestId = httpContext?.Request.Query["guestId"].ToString();
        
        if (!string.IsNullOrEmpty(guestId))
        {
            ChatConnectionManager.RemoveConnection(guestId);
        }
        else
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                ChatConnectionManager.RemoveConnection(userId);
            }
        }

        return base.OnDisconnectedAsync(exception);
    }
    
    private async System.Threading.Tasks.Task<string> GenerateUniqueAnonymousNameAsync()
    {
        string baseName = "Khách";
        int suffix = 1;
        string candidate;
    
        do
        {
            candidate = $"{baseName} {suffix}";
            suffix++;
        } while (await _context.GuestInfos.AnyAsync(g => g.Name == candidate));
    
        return candidate;
    }
}