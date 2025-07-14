using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patients.ViewInvoices;

public class ViewListInvoiceHandler : IRequestHandler<ViewListInvoiceCommand, List<ViewInvoiceDto>>
{
    private readonly IInvoiceRepository _invoiceRepo;
    private readonly IHttpContextAccessor _httpContext;
    private readonly IMapper _mapper;

    public ViewListInvoiceHandler(
        IInvoiceRepository invoiceRepo,
        IHttpContextAccessor httpContext,
        IMapper mapper)
    {
        _invoiceRepo = invoiceRepo;
        _httpContext = httpContext;
        _mapper = mapper;
    }

    public async Task<List<ViewInvoiceDto>> Handle(ViewListInvoiceCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContext.HttpContext?.User 
                   ?? throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        var roleTableId = user.FindFirst("role_table_id")?.Value;
        if (string.IsNullOrEmpty(roleTableId))
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        var patientId = int.Parse(roleTableId);

        List<Invoice> invoices;

        if (role == "Patient")
        {
            // Bắt buộc chỉ được xem của chính mình, override filter
            invoices = await _invoiceRepo.GetFilteredInvoicesAsync(
                request.Status, request.FromDate, request.ToDate, patientId);
        }
        else if (role == "Receptionist")
        {
            // Có thể xem tất cả, hoặc lọc theo bệnh nhân cụ thể nếu request.PatientId có giá trị
            invoices = await _invoiceRepo.GetFilteredInvoicesAsync(
                request.Status, request.FromDate, request.ToDate, request.PatientId);
        }
        else
        {
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
        }

        return _mapper.Map<List<ViewInvoiceDto>>(invoices);
    }
}
