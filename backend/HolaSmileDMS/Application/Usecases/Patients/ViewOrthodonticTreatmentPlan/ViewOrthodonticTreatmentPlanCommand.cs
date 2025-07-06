using MediatR;

namespace Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;

public class ViewOrthodonticTreatmentPlanCommand: IRequest<OrthodonticTreatmentPlanDto>
{
    public int PlanId { get; set; }
    public int? PatientId { get; set; }

    public ViewOrthodonticTreatmentPlanCommand(int planId, int? patientId)
    {
        PlanId = planId;
        PatientId = patientId;
    }
}