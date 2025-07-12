namespace Application.Usecases.Patients.ViewInvoices;

public class ViewInvoiceDto
{
    public int InvoiceId { get; set; }
    public int PatientId { get; set; }
    public int TreatmentRecordId { get; set; }
    public int TotalAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? TransactionType { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; }
    public decimal? PaidAmount { get; set; }
    public decimal? RemainingAmount { get; set; }
    public string? OrderCode { get; set; }
    public string? TransactionId { get; set; }
    public DateTime CreatedAt { get; set; }

    public string? PatientName { get; set; }
}