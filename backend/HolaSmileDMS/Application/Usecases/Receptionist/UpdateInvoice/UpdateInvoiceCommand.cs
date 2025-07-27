using MediatR;

namespace Application.Usecases.Receptionist.UpdateInvoice;

public class UpdateInvoiceCommand : IRequest<string>
{
    public int InvoiceId { get; set; }
    public int PatientId { get; set; }
    public string? PaymentMethod { get; set; }
    public string? TransactionType { get; set; }
    public string? Status { get; set; }
    public string? Description { get; set; }
    public decimal? PaidAmount { get; set; }
}