using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patients.ViewInvoices;

public class ViewDetailInvoiceHandler : IRequestHandler<ViewDetailInvoiceCommand, ViewInvoiceDto>
{
    private readonly IInvoiceRepository _invoiceRepo;
    private readonly IHttpContextAccessor _httpContext;
    private readonly IMapper _mapper;

    public ViewDetailInvoiceHandler(
        IInvoiceRepository invoiceRepo,
        IHttpContextAccessor httpContext,
        IMapper mapper)
    {
        _invoiceRepo = invoiceRepo;
        _httpContext = httpContext;
        _mapper = mapper;
    }

    public async Task<ViewInvoiceDto> Handle(ViewDetailInvoiceCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContext.HttpContext?.User
                   ?? throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        var roleTableIdStr = user.FindFirst("role_table_id")?.Value;

        if (string.IsNullOrEmpty(role) || string.IsNullOrEmpty(roleTableIdStr))
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        var roleTableId = int.Parse(roleTableIdStr);

        var invoice = await _invoiceRepo.GetInvoiceByIdAsync(request.InvoiceId)
                      ?? throw new Exception(MessageConstants.MSG.MSG16);

        switch (role)
        {
            case "Patient":
                if (invoice.PatientId != roleTableId)
                    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
                break;

            case "Receptionist":
                // Có quyền xem tất cả => không cần xử lý gì
                break;

            default:
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
        }

        return _mapper.Map<ViewInvoiceDto>(invoice);
    }
}
