using MediatR;

namespace Application.Usecases.Patients.ViewInvoices;
public class ViewDetailInvoiceCommand : IRequest<ViewInvoiceDto>
{
    public int InvoiceId { get; set; }

    public ViewDetailInvoiceCommand(int invoiceId)
    {
        InvoiceId = invoiceId;
    }
}
