public class Prescription
{
    [Key]
    public int PrescriptionId { get; set; }

    [ForeignKey("TreatmentRecord")]
    public int? TreatmentRecord_Id { get; set; }
    public TreatmentRecord? TreatmentRecord { get; set; }

    [ForeignKey("PrescriptionTemplate")]
    public int? Pre_TemplateID { get; set; }
    public PrescriptionTemplate? PrescriptionTemplate { get; set; }

    public string? Content { get; set; }

    public int? CreateBy { get; set; }
    public int? UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }
}
