using Application.Usecases.Assistant.ViewAssignedTasks;

namespace Application.Interfaces
{
    public interface IAssistantRepository
    {
        Task<List<AssignedTaskDto>> GetTasksByAssistantIdAsync(int assistantId, CancellationToken cancellationToken);
    }
}
