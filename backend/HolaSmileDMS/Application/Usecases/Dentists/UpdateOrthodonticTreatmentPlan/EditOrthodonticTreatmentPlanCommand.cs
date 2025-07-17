using MediatR;

namespace Application.Usecases.Dentists.UpdateOrthodonticTreatmentPlan;

public class EditOrthodonticTreatmentPlanCommand : IRequest<string>
{
    public EditOrthodonticTreatmentPlanDto Dto { get; set; }
    public EditOrthodonticTreatmentPlanCommand(EditOrthodonticTreatmentPlanDto dto)
    {
        Dto = dto;
    }
}