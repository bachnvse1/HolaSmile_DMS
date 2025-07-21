namespace Application.Interfaces;

public interface IInstructionRepository
{
    Task<List<Instruction>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default);
    Task<bool> CreateAsync(Instruction instruction, CancellationToken ct = default);
}