using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.CreateInvoice;

public class CreateInvoiceHandler : IRequestHandler<CreateInvoiceCommand, string>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IPatientRepository _patientRepository;
    private readonly ITreatmentRecordRepository _treatmentRecordRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMediator _mediator;
    private readonly ITransactionRepository _financialTransactionRepository;

    public CreateInvoiceHandler(
        IInvoiceRepository invoiceRepository,
        ITreatmentRecordRepository treatmentRecordRepository,
        IHttpContextAccessor httpContextAccessor, IPatientRepository patientRepository, IMediator mediator, ITransactionRepository financialTransactionRepository)
    {
        _invoiceRepository = invoiceRepository;
        _treatmentRecordRepository = treatmentRecordRepository;
        _httpContextAccessor = httpContextAccessor;
        _patientRepository = patientRepository;
        _mediator = mediator;
        _financialTransactionRepository = financialTransactionRepository;
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
        
        // Nếu đã có bất kỳ hoá đơn nào của TreatmentRecord này chưa thanh toán → chặn tạo mới
        var hasUnpaidInvoice = await _invoiceRepository.HasUnpaidInvoice(request.TreatmentRecordId);

        if (hasUnpaidInvoice)
            throw new Exception("Vui lòng thanh toán các hoá đơn trước đó trước khi tạo hoá đơn mới.");

        if (role == "Patient")
        {
            request.PaymentMethod = "PayOS"; // mặc định online
        }
        else // Receptionist
        {
            if (request.PaymentMethod != "PayOS" && request.PaymentMethod != "cash")
                throw new ArgumentException("Phương thức thanh toán không hợp lệ");
        }

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
        var orderCode = $"{DateTime.Now:yyMMddHHmm}{new Random().Next(10, 99)}";

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
            OrderCode = orderCode,
            RemainingAmount = remaining,
            CreatedAt = DateTime.Now,
            CreatedBy = userId,
            IsDeleted = false
        };

        await _invoiceRepository.CreateInvoiceAsync(invoice);
        
        // Create FinancialTransaction after invoice is created
        var financialTransaction = new FinancialTransaction
        {
            TransactionDate = DateTime.Now,
            Description = "Thanh toán hoá đơn, " + invoice.OrderCode,
            TransactionType = true, // true: income (thu)
            Category = "Thanh toán hoá đơn",
            PaymentMethod = invoice.PaymentMethod == "cash", // true: cash, false: transfer
            Amount = invoice.PaidAmount ?? 0,
            CreatedAt = DateTime.Now,
            CreatedBy = userId,
            IsDelete = false
        };

        await _financialTransactionRepository.CreateTransactionAsync(financialTransaction);
        
        var patient = await _patientRepository.GetPatientByPatientIdAsync(request.PatientId);
        if (patient != null)
        {
            int userIdNotification = patient.UserID ?? 0;
            if (userIdNotification > 0)
            {
                try
                {
                    var message =
                        $"Hoá đơn thanh toán {invoice.OrderCode} đã được tạo";
                    await _mediator.Send(new SendNotificationCommand(
                        userIdNotification,
                        "Tạo hoá đơn thanh toán",
                        message,
                        "invoice",
                        userId, ""
                    ), cancellationToken);
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }
        }

        return MessageConstants.MSG.MSG19; // "Tạo hoá đơn thành công"
    }
}