
namespace Application.Interfaces
{
    public interface IInstructionTemplateRepository
    {
        Task<InstructionTemplate?> GetByIdAsync(int id, CancellationToken ct = default);
        System.Threading.Tasks.Task CreateAsync(InstructionTemplate entity);
        Task<List<InstructionTemplate>> GetAllAsync();
        System.Threading.Tasks.Task UpdateAsync(InstructionTemplate entity);
    }
}