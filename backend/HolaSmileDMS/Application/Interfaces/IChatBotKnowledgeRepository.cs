using System.Threading.Tasks;
using Application.Usecases.Guests.AskChatBot;
using Domain.Entities;

namespace Application.Interfaces
{
    public interface IChatBotKnowledgeRepository
    {
        Task<List<ChatBotKnowledge>> GetAllAsync();
        Task<bool> CreateNewKnownledgeAsync(ChatBotKnowledge knowledge);
        Task<ChatBotKnowledge?> GetByIdAsync(int id);
        Task<bool> UpdateResponseAsync(ChatBotKnowledge chatBotKnowledge);
        Task<ClinicDataDto?> GetClinicDataAsync(CancellationToken ct);
    }
}
