using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.UpdateInvoice;

public class UpdateInvoiceHandler : IRequestHandler<UpdateInvoiceCommand, string>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IPatientRepository _patientRepository;
    private readonly IMediator _mediator;


    public UpdateInvoiceHandler(IInvoiceRepository invoiceRepository, IHttpContextAccessor httpContextAccessor, IPatientRepository patientRepository, IMediator mediator)
    {
        _invoiceRepository = invoiceRepository;
        _httpContextAccessor = httpContextAccessor;
        _patientRepository = patientRepository;
        _mediator = mediator;
    }

    public async Task<string> Handle(UpdateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User
                   ?? throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);

        var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        var roleIdClaim = user.FindFirst("role_table_id")?.Value;

        if (role != "Receptionist" && role != "Patient")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        var invoice = await _invoiceRepository.GetInvoiceByIdAsync(request.InvoiceId);
        if (invoice == null)
            throw new Exception("Invoice not found");

        if (role == "Patient" && int.Parse(roleIdClaim ?? "0") != invoice.PatientId)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
        
        if (invoice.Status != "pending")
            throw new InvalidOperationException(MessageConstants.MSG.MSG55); // "Hoá đơn đã được thanh toán"

        // Validate allowed fields
        if (request.PaymentMethod != null && request.PaymentMethod != "PayOS" && request.PaymentMethod != "cash")
            throw new ArgumentException("Phương thức thanh toán không hợp lệ");

        if (request.TransactionType != null && request.TransactionType != "full" && request.TransactionType != "partial")
            throw new ArgumentException("Loại giao dịch không hợp lệ");

        // Update allowed fields
        invoice.PaymentMethod = request.PaymentMethod ?? invoice.PaymentMethod;
        invoice.TransactionType = request.TransactionType ?? invoice.TransactionType;
        invoice.Description = request.Description ?? invoice.Description;
        invoice.PaidAmount = request.PaidAmount ?? invoice.PaidAmount;

        if (request.PaidAmount.HasValue)
        {
            // Tính lại tổng tiền đã thanh toán trước đó, không bao gồm hoá đơn hiện tại
            var totalPaidExcludingThis = await _invoiceRepository
                .GetTotalPaidForTreatmentRecord(invoice.TreatmentRecord_Id);

            var newTotalPaid = totalPaidExcludingThis + request.PaidAmount.Value;

            if (newTotalPaid > invoice.TotalAmount)
                throw new ArgumentException("Tổng tiền thanh toán vượt quá tổng chi phí điều trị");

            invoice.RemainingAmount = invoice.TotalAmount - newTotalPaid;
            invoice.PaidAmount = request.PaidAmount.Value;
        }
        
        invoice.UpdatedAt = DateTime.Now;
        invoice.UpdatedBy = userId;

        await _invoiceRepository.UpdateInvoiceAsync(invoice);
        var patient = await _patientRepository.GetPatientByPatientIdAsync(request.PatientId);
        if (patient != null)
        {
            int userIdNotification = patient.UserID ?? 0;
            if (userIdNotification > 0)
            {
                try
                {
                    var message =
                        $"Hoá đơn thanh toán {invoice.OrderCode} đã được update lúc {invoice.UpdatedAt}";
                    await _mediator.Send(new SendNotificationCommand(
                        userIdNotification,
                        "Thanh toán",
                        message,
                        "invoice",
                        userId
                    ), cancellationToken);
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }
        }
        return MessageConstants.MSG.MSG32; // "Cập nhật hoá đơn thành công"
    }
}