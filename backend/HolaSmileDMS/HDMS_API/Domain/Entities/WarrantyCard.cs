public class WarrantyCard
{
    [Key]
    public int WarrantyCardID { get; set; }

    [ForeignKey("TreatmentRecord")]
    public int? TreatmentRecordID { get; set; }
    public TreatmentRecord? TreatmentRecord { get; set; }

    [ForeignKey("Procedure")]
    public int? ProcedureID { get; set; }
    public Procedure? Procedure { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public string? Term { get; set; }

    public bool Status { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreateBy { get; set; }
    public int? UpdatedBy { get; set; }
}
