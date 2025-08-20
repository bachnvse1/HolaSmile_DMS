using Application.Usecases.Guests.AskChatBot;
using Application.Usecases.UserCommon.ChatbotUserData;
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
        Task<UserCommonDataDto?> GetUserCommonDataAsync(CancellationToken ct);
        Task<OwnerData> GetOwnerData(CancellationToken ct);
        Task<DentistData> GetDentistData(int userId, CancellationToken ct);
        Task<PatientData> GetPatientData(int userId, CancellationToken ct);
        Task<ReceptionistData> GetReceptionistData(int userId, CancellationToken ct);
        Task<AssistantData> GetAssistanttData(int userId, CancellationToken ct);

    }
}
