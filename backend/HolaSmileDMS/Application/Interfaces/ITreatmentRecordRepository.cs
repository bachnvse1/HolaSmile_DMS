using Application.Usecases.Patients.ViewTreatmentRecord;

namespace Application.Interfaces;

public interface ITreatmentRecordRepository
{
    Task<List<ViewTreatmentRecordDto>> GetPatientTreatmentRecordsAsync(int patientId, CancellationToken cancellationToken);
}