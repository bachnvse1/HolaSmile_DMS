using MediatR;

namespace Application.Usecases.Dentist.CreateOrthodonticTreatmentPlan;

public class CreateOrthodonticTreatmentPlanCommand : IRequest<string>
{
    public int PatientId { get; set; }
    public int DentistId { get; set; }

    public string? PlanTitle { get; set; }
    public string? TemplateName { get; set; }

    public string? TreatmentHistory { get; set; }
    public string? ReasonForVisit { get; set; }
    public string? ExaminationFindings { get; set; }
    public string? IntraoralExam { get; set; }
    public string? XRayAnalysis { get; set; }
    public string? ModelAnalysis { get; set; }
    public string? TreatmentPlanContent { get; set; }

    public int TotalCost { get; set; }
    public string? PaymentMethod { get; set; }

    public bool StartToday { get; set; }
}
