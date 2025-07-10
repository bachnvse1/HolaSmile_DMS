using MediatR;

namespace Application.Usecases.Dentist.DeactiveOrthodonticTreatmentPlan;

public class DeactiveOrthodonticTreatmentPlanCommand : IRequest<string>
{
    public int PlanId { get; set; }

    public DeactiveOrthodonticTreatmentPlanCommand(int planId)
    {
        PlanId = planId;
    }
    public DeactiveOrthodonticTreatmentPlanCommand() { }
}