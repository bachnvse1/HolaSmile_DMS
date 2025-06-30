using Application.Usecases.Assistant.ViewAssignedTasks;

namespace Application.Interfaces
{
    public interface ITaskRepository
    {
        Task<bool> CreateTaskAsync(Task task, CancellationToken cancellationToken);

        Task<List<AssignedTaskDto>> GetTasksByAssistantIdAsync(int assistantId, CancellationToken cancellationToken);

        Task<Task?> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken);

        Task<bool> UpdateTaskAsync(Task task, CancellationToken cancellationToken);
        Task<TreatmentProgress?> GetTreatmentProgressByIdAsync(int id, CancellationToken cancellationToken);

    }
}
