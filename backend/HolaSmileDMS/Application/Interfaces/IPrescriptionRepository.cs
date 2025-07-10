namespace Application.Interfaces;

public interface IPrescriptionRepository
{
    Task<List<Prescription>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default);
    Task<Prescription?> GetPrescriptionByAppointmentIdAsync(int appId);
    Task<Prescription?> GetPrescriptionByPrescriptionIdAsync(int preId);
    Task<bool> CreatePrescriptionAsync(Prescription prescription);
    Task<bool> UpdatePrescriptionAsync(Prescription prescription);
}