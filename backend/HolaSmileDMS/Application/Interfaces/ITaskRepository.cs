namespace Application.Interfaces
{
    public interface ITaskRepository
    {
        Task<bool> CreateTaskAsync(Task task, CancellationToken cancellationToken);
    }
}
