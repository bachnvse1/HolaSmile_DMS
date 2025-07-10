using Azure;
using MediatR;

namespace Application.Usecases.Receptionist.CreateInvoice;

public class CreateInvoiceCommand : IRequest<string>
{
    public int PatientId { get; set; }
    public int TreatmentRecordId { get; set; }
    public string PaymentMethod { get; set; } = default!; // "PayOS" | "cash"
    public string TransactionType { get; set; } = default!; // "full" | "partial"
    public string? Description { get; set; } // default "Thanh toán điều trị"
    public decimal PaidAmount { get; set; }
}