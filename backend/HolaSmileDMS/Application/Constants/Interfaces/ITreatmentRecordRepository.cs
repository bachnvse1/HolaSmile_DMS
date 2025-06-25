using Application.Usecases.Patients.UpdateTreatmentRecord;
using Application.Usecases.Patients.ViewTreatmentRecord;

namespace Application.Constants.Interfaces;

public interface ITreatmentRecordRepository
{
    Task<List<ViewTreatmentRecordDto>> GetPatientTreatmentRecordsAsync(int patientId, CancellationToken cancellationToken);
    Task<bool> DeleteTreatmentRecordAsync(int id, int? updatedBy, CancellationToken cancellationToken);
    Task<TreatmentRecord?> GetTreatmentRecordByIdAsync(int id, CancellationToken cancellationToken);
    Task<bool> UpdatedTreatmentRecordAsync(TreatmentRecord record, CancellationToken cancellationToken);
    System.Threading.Tasks.Task AddAsync(TreatmentRecord record, CancellationToken cancellationToken);
}