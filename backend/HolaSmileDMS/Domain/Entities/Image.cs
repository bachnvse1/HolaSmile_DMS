using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Image
{
    [Key]
    public int ImageId { get; set; }

    [ForeignKey("Patient")]
    public int? PatientId { get; set; }
    public Patient? Patient { get; set; }

    [ForeignKey("TreatmentRecord")]
    public int? TreatmentRecordId { get; set; }
    public TreatmentRecord? TreatmentRecord { get; set; }

    public OrthodonticTreatmentPlan? OrthodonticTreatmentPlan { get; set; }
    [ForeignKey("OrthodonticTreatmentPlan")]
    public int? OrthodonticTreatmentPlanId { get; set; }

    public string? ImageURL { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }
}
