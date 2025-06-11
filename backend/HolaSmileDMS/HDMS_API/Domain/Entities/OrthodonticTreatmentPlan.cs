public class OrthodonticTreatmentPlan
{
    [Key]
    public int PlanId { get; set; }

    [ForeignKey("Patient")]
    public int PatientId { get; set; }
    public Patient Patient { get; set; }

    [ForeignKey("Dentist")]
    public int DentistId { get; set; }
    public Dentist Dentist { get; set; }

    [MaxLength(255)]
    public string? PlanTitle { get; set; }

    [MaxLength(255)]
    public string? TemplateName { get; set; }

    public string? TreatmentHistory { get; set; }
    public string? ReasonForVisit { get; set; }
    public string? ExaminationFindings { get; set; }
    public string? IntraoralExam { get; set; }
    public string? XRayAnalysis { get; set; }
    public string? ModelAnalysis { get; set; }
    public string? TreatmentPlanContent { get; set; }

    public int TotalCost { get; set; }

    [MaxLength(255)]
    public string? PaymentMethod { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }
}
