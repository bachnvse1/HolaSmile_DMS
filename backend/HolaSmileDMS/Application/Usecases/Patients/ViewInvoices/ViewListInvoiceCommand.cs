using MediatR;

namespace Application.Usecases.Patients.ViewInvoices;

public class ViewListInvoiceCommand : IRequest<List<ViewInvoiceDto>>
{
    public string? Status { get; set; }               // "Paid", "Unpaid", "PartiallyPaid"
    public DateTime? FromDate { get; set; }           // Lọc từ ngày
    public DateTime? ToDate { get; set; }             // Lọc đến ngày
    public int? PatientId { get; set; }               // Lọc theo bệnh nhân (chỉ áp dụng cho Receptionist)
}