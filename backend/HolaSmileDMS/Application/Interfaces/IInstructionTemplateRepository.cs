
namespace Application.Interfaces
{
    public interface IInstructionTemplateRepository
    {
        Task<InstructionTemplate?> GetByIdAsync(int id, CancellationToken ct = default);
    }
}
