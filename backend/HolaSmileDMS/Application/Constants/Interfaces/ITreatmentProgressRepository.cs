namespace Application.Constants.Interfaces;

public interface ITreatmentProgressRepository
{
    Task<List<TreatmentProgress>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken cancellationToken);

}