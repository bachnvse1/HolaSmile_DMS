using Application.Usecases.UserCommon.ViewNotification;

namespace Application.Interfaces
{
    public interface INotificationsRepository
    {
        Task<List<Notification>> GetAllNotificationsForUserAsync(int userId, CancellationToken cancellationToken);
        
        System.Threading.Tasks.Task AddAsync(Notification notification, CancellationToken ct);

        System.Threading.Tasks.Task MarkAsSentAsync(int notificationId, CancellationToken ct);

        System.Threading.Tasks.Task SendNotificationAsync(Notification notification, CancellationToken ct);
        Task<int> CountUnreadNotificationsAsync(int userId, CancellationToken cancellationToken);
    }
}
