using Microsoft.AspNetCore.SignalR;

namespace Infrastructure.Hubs
{
    public class NotifyHub : Hub
    {
        // (Tùy chọn) override OnConnectedAsync để xử lý khi người dùng kết nối
        public override async System.Threading.Tasks.Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            await base.OnConnectedAsync();
        }
    }
}