using Application.Usecases.Patients.ViewTreatmentRecord;

namespace Application.Interfaces;

public interface ITreatmentRecordRepository
{
    Task<List<ViewTreatmentRecordDto>> GetPatientTreatmentRecordsAsync(int patientId, CancellationToken cancellationToken);
    Task<bool> DeleteTreatmentRecordAsync(int id, int? updatedBy, CancellationToken cancellationToken);
}