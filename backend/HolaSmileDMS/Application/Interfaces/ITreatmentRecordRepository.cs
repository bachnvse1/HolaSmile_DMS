using Application.Usecases.Patients.UpdateTreatmentRecord;
using Application.Usecases.Patients.ViewTreatmentRecord;

namespace Application.Interfaces;

public interface ITreatmentRecordRepository
{
    Task<List<ViewTreatmentRecordDto>> GetPatientTreatmentRecordsAsync(int patientId, CancellationToken cancellationToken);
    Task<TreatmentRecord?> GetTreatmentRecordByIdAsync(int id, CancellationToken cancellationToken);
    Task<bool> SaveChangesAsync(CancellationToken cancellationToken);
}