public class TreatmentRecord
{
    [Key]
    public int TreatmentRecordID { get; set; }

    [ForeignKey("Appointment")]
    public int AppointmentID { get; set; }
    public Appointment Appointment { get; set; }

    [ForeignKey("Dentist")]
    public int DentistID { get; set; }
    public Dentist Dentist { get; set; }

    [ForeignKey("Procedure")]
    public int ProcedureID { get; set; }
    public Procedure Procedure { get; set; }

    [MaxLength(200)]
    public string? ToothPosition { get; set; }

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? DiscountAmount { get; set; }
    public float? DiscountPercentage { get; set; }
    public decimal TotalAmount { get; set; }

    public int? ConsultantEmployeeID { get; set; }

    [MaxLength(255)]
    public string? TreatmentStatus { get; set; }

    public bool IsWarranty { get; set; }
    public bool Installment { get; set; }

    public string? Symptoms { get; set; }
    public string? Diagnosis { get; set; }

    [Column(TypeName = "date")]
    public DateTime TreatmentDate { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }
}
