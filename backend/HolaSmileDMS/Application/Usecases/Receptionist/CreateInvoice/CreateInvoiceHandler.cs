using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.CreateInvoice;

public class CreateInvoiceHandler : IRequestHandler<CreateInvoiceCommand, string>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly ITreatmentRecordRepository _treatmentRecordRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CreateInvoiceHandler(
        IInvoiceRepository invoiceRepository,
        ITreatmentRecordRepository treatmentRecordRepository,
        IHttpContextAccessor httpContextAccessor)
    {
        _invoiceRepository = invoiceRepository;
        _treatmentRecordRepository = treatmentRecordRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<string> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User
                   ?? throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);

        var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var roleIdClaim = user.FindFirst("role_table_id")?.Value;
        var role = user.FindFirst(ClaimTypes.Role)?.Value;

        // Check permission
        if (role != "Receptionist" && role != "Patient")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        if (role == "Patient" && int.Parse(roleIdClaim ?? "0") != request.PatientId)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        // Validate input
        if (request.PaymentMethod != "PayOS" && request.PaymentMethod != "cash")
            throw new ArgumentException("Phương thức thanh toán không hợp lệ");

        if (request.TransactionType != "full" && request.TransactionType != "partial")
            throw new ArgumentException("Loại giao dịch không hợp lệ");

        var treatmentRecord = await _treatmentRecordRepository
            .GetTreatmentRecordByIdAsync(request.TreatmentRecordId, cancellationToken);

        if (treatmentRecord == null)
            throw new Exception("Treatment record not found");

        // Tính tổng tiền đã trả trước đó
        var totalPaid = await _invoiceRepository.GetTotalPaidForTreatmentRecord(request.TreatmentRecordId);
        var totalAmount = treatmentRecord.TotalAmount;
        var newTotalPaid = totalPaid + request.PaidAmount;

        if (newTotalPaid > totalAmount)
            throw new ArgumentException("Tổng tiền thanh toán vượt quá tổng chi phí điều trị");

        // Tính remaining & status
        var remaining = totalAmount - newTotalPaid;

        var invoice = new Invoice
        {
            PatientId = request.PatientId,
            TreatmentRecord_Id = request.TreatmentRecordId,
            TotalAmount = (int)totalAmount,
            PaymentMethod = request.PaymentMethod,
            TransactionType = request.TransactionType,
            PaymentDate = null,
            Description = request.Description ?? "Thanh toán điều trị",
            Status = "pending",
            PaidAmount = request.PaidAmount,
            RemainingAmount = remaining,
            CreatedAt = DateTime.Now,
            CreatedBy = userId,
            IsDeleted = false
        };

        await _invoiceRepository.CreateInvoiceAsync(invoice);

        return MessageConstants.MSG.MSG19; // "Tạo hoá đơn thành công"
    }
}