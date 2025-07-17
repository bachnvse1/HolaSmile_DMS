using System.ComponentModel.DataAnnotations;

public class WarrantyCard
{
    [Key]
    public int WarrantyCardID { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public int? Duration { get; set; }

    public bool Status { get; set; }
    public DateTime? CreateAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreateBy { get; set; }
    public int? UpdatedBy { get; set; }
    
    public bool IsDelete { get; set; }

    public TreatmentRecord TreatmentRecord { get; set; }
    public int TreatmentRecordID { get; set; }

}
