public class Invoice
{
    [Key]
    public int InvoiceId { get; set; }

    [ForeignKey("Patient")]
    public int PatientId { get; set; }
    public Patient Patient { get; set; }

    [ForeignKey("TreatmentRecord")]
    public int TreatmentRecord_Id { get; set; }
    public TreatmentRecord TreatmentRecord { get; set; }

    public int TotalAmount { get; set; }

    [MaxLength(255)]
    public string? PaymentMethod { get; set; }

    [MaxLength(255)]
    public string? TransactionType { get; set; }

    public DateTime PaymentDate { get; set; }

    public string? Description { get; set; }

    public decimal? PaidAmount { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }
}
