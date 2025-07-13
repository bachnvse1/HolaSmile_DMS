using Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;

namespace Application.Interfaces;

public interface IOrthodonticTreatmentPlanRepository
{
    Task<OrthodonticTreatmentPlanDto?> GetPlanByIdAsync(int planId, int patientId, CancellationToken cancellationToken);
    Task<OrthodonticTreatmentPlan?> GetPlanByPlanIdAsync(int planId, CancellationToken cancellationToken);
    System.Threading.Tasks.Task AddAsync(OrthodonticTreatmentPlan plan, CancellationToken cancellationToken);
    System.Threading.Tasks.Task UpdateAsync(OrthodonticTreatmentPlan plan);
    Task<List<OrthodonticTreatmentPlan>> GetAllByPatientIdAsync(int patientId, CancellationToken cancellationToken);
}