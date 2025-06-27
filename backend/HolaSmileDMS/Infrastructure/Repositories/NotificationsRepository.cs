using Application.Interfaces;
using Application.Usecases.SendNotification;
using Application.Usecases.UserCommon.ViewNotification;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class NotificationsRepository : INotificationsRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotifyHub> _hub;
        private readonly IMapper                _mapper;

        public NotificationsRepository(ApplicationDbContext context,  IHubContext<NotifyHub> hub,
            IMapper mapper)
        {
            _context = context;
            _hub   = hub;
            _mapper = mapper;
        }

        public async Task<List<Notification>> GetAllNotificationsForUserAsync(int userId, CancellationToken cancellationToken)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async System.Threading.Tasks.Task AddAsync(Notification n, CancellationToken ct)
        {
            _context.Notifications.Add(n);
            await _context.SaveChangesAsync(ct);
        }

        public async System.Threading.Tasks.Task MarkAsSentAsync(int id, CancellationToken ct)
        {
            await _context.Notifications
                .Where(x => x.NotificationId == id)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsRead, p => p.IsRead), ct);
        }

        /// <summary>
        /// Gửi realtime qua SignalR + lưu DB chỉ qua 1 hàm
        /// </summary>
        public async System.Threading.Tasks.Task SendNotificationAsync(Notification n, CancellationToken ct)
        {
            await AddAsync(n, ct); // Lưu trước để có NotificationId

            var dto = _mapper.Map<NotificationDto>(n);

            await _hub.Clients
                .User(n.UserId.ToString())
                .SendAsync("ReceiveNotification", dto, ct);

            await MarkAsSentAsync(n.NotificationId, ct);
        }
    }
}
