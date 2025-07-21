namespace Application.Interfaces;

public interface IInstructionRepository
{
    Task<List<Instruction>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default);
    Task<bool> CreateAsync(Instruction instruction, CancellationToken ct = default);
    Task<List<Instruction>> GetInstructionsByAppointmentIdsAsync(List<int> appointmentIds);
    Task<bool> ExistsByAppointmentIdAsync(int appointmentId, CancellationToken ct = default);
    Task<Instruction?> GetByIdAsync(int instructionId, CancellationToken ct = default);
    Task<bool> UpdateAsync(Instruction instruction, CancellationToken ct = default);
}