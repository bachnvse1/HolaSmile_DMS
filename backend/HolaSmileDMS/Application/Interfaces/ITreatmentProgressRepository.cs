namespace Application.Interfaces;

public interface ITreatmentProgressRepository
{
    Task<List<TreatmentProgress>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken cancellationToken);
    System.Threading.Tasks.Task CreateAsync(TreatmentProgress progress);
    Task<TreatmentProgress?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(TreatmentProgress progress, CancellationToken cancellationToken);
}