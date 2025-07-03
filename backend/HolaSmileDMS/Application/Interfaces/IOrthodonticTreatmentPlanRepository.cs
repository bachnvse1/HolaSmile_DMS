using Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;

namespace Application.Interfaces;

public interface IOrthodonticTreatmentPlanRepository
{
    Task<OrthodonticTreatmentPlanDto?> GetPlanByIdAsync(int planId, int patientId, CancellationToken cancellationToken);
}