using MediatR;

namespace Application.Usecases.Patients.ViewAllOrthodonticTreatmentPlan;

public class ViewAllOrthodonticTreatmentPlanCommand : IRequest<List<ViewOrthodonticTreatmentPlanDto>>
{
    public int PatientId { get; set; }

    public ViewAllOrthodonticTreatmentPlanCommand(int patientId)
    {
        PatientId = patientId;
    }
    public ViewAllOrthodonticTreatmentPlanCommand()
    {
    }
}