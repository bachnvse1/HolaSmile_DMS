using Application.Usecases.Dentists.AssignTasksToAssistantHandler;

namespace Application.Interfaces
{
    public interface IAssistantRepository
    {
        Task<List<AssistantListDto>> GetAllAssistantsAsync();
    }
}
