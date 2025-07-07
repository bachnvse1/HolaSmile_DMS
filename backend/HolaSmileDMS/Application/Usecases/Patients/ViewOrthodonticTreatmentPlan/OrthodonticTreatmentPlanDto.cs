namespace Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;

public class OrthodonticTreatmentPlanDto
{
    public string PatientName { get; set; }
    public string DentistName { get; set; }

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

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
}