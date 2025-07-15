namespace Application.Usecases.Dentists.UpdateOrthodonticTreatmentPlan;

public class EditOrthodonticTreatmentPlanDto
{
    public int PlanId { get; set; }
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
}