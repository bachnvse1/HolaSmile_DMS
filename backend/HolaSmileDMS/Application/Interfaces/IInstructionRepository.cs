namespace Application.Interfaces;

public interface IInstructionRepository
{
    Task<List<Instruction>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default);
}