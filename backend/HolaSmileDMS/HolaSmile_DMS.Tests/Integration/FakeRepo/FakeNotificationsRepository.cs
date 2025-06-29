using Application.Interfaces;

namespace Infrastructure.Repositories;

public class FakeNotificationsRepository : INotificationsRepository
{
    public System.Threading.Tasks.Task SendNotificationAsync(Notification n, CancellationToken ct)
    {
        return System.Threading.Tasks.Task.CompletedTask; // giả lập không lỗi
    }

    public Task<List<Notification>> GetAllNotificationsForUserAsync(int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public System.Threading.Tasks.Task AddAsync(Notification notification, CancellationToken ct)
    {
        throw new NotImplementedException();
    }

    public System.Threading.Tasks.Task MarkAsSentAsync(int id, CancellationToken ct)
    {
        return System.Threading.Tasks.Task.CompletedTask;
    }
}
