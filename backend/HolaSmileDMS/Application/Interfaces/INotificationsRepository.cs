using Application.Usecases.UserCommon.ViewNotification;

namespace Application.Interfaces
{
    public interface INotificationsRepository
    {
        Task<List<Notification>> GetAllNotificationsForUserAsync(int userId, CancellationToken cancellationToken);
    }
}
