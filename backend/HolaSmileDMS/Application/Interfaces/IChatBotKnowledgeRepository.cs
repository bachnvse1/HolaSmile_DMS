using System.Threading.Tasks;
using Domain.Entities;

namespace Application.Interfaces
{
    public interface IChatBotKnowledgeRepository
    {
        Task<List<ChatBotKnowledge>> GetAllAsync();
        Task<bool> CreateNewKnownledgeAsync(ChatBotKnowledge knowledge);
    }
}
