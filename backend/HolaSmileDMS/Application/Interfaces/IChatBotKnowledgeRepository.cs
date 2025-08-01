using Domain.Entities;

namespace Application.Interfaces
{
    public interface IChatBotKnowledgeRepository
    {
        Task<List<ChatBotKnowledge>> GetAllAsync();
    }
}
