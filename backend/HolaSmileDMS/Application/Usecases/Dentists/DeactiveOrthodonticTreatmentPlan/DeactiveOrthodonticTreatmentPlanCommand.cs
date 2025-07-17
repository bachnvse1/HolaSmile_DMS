using MediatR;

namespace Application.Usecases.Dentists.DeactiveOrthodonticTreatmentPlan;

public class DeactiveOrthodonticTreatmentPlanCommand : IRequest<string>
{
    public int PlanId { get; set; }

    public DeactiveOrthodonticTreatmentPlanCommand(int planId)
    {
        PlanId = planId;
    }
    public DeactiveOrthodonticTreatmentPlanCommand() { }
}