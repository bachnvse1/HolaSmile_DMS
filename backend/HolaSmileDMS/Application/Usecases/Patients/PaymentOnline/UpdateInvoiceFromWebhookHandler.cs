using System.Text.Json;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.Patients.PaymentOnline;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.Extensions.Configuration;

public sealed class UpdateInvoiceFromWebhookHandler : IRequestHandler<UpdateInvoiceFromWebhookCommand, Unit>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IConfiguration _configuration;
    private readonly IPayOSService _payOsService;
    private readonly IPatientRepository _patientRepository;
    private readonly IMediator _mediator;
    private readonly IUserCommonRepository _userCommonRepository;

    public UpdateInvoiceFromWebhookHandler(
        IInvoiceRepository invoiceRepository,
        IConfiguration configuration,
        IPayOSService payOsService,
        IPatientRepository patientRepository,
        IMediator mediator,
        IUserCommonRepository userCommonRepository)
    {
        _invoiceRepository = invoiceRepository;
        _configuration = configuration;
        _payOsService = payOsService;
        _patientRepository = patientRepository;
        _mediator = mediator;
        _userCommonRepository = userCommonRepository;
    }

    public async Task<Unit> Handle(UpdateInvoiceFromWebhookCommand request, CancellationToken cancellationToken)
    {
        var checksumKey = _configuration["PayOS:ChecksumKey"]!;
        var isValid = _payOsService.VerifyChecksum(request.RawJson, checksumKey);
        if (!isValid)
            throw new UnauthorizedAccessException("Invalid signature");

        var root = JsonDocument.Parse(request.RawJson).RootElement;
        var data = root.GetProperty("data");

        var statusCode = data.GetProperty("code").GetString();
        if (statusCode != "00") return Unit.Value;

        var orderCode = data.GetProperty("orderCode").GetInt64().ToString();
        var transactionId = data.GetProperty("reference").GetString();
        var paidTime = DateTime.Parse(data.GetProperty("transactionDateTime").GetString()!);

        var invoice = await _invoiceRepository.GetByOrderCodeAsync(orderCode, cancellationToken);
        if (invoice is not null)
        {
            invoice.PaymentDate = paidTime;
            invoice.TransactionId = transactionId;
            invoice.UpdatedAt = DateTime.UtcNow;
            invoice.Status = "paid";

            await _invoiceRepository.UpdateAsync(invoice, cancellationToken);
            
            var patient = await _patientRepository.GetPatientByPatientIdAsync(invoice.PatientId);
            if (patient != null)
            {
                int userIdNotification = patient.UserID ?? 0;
                if (userIdNotification > 0)
                {
                    try
                    {
                        var message =
                            $"Hoá đơn thanh toán {invoice.OrderCode} của BN {patient.User.Fullname} đã được thanh toán.";
                        await _mediator.Send(new SendNotificationCommand(
                            userIdNotification,
                            "Hoá đơn thanh toán",
                            message,
                            "invoice",
                            0, "invoices"
                        ), cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(ex.Message);
                    }
                
                    try
                    {
                        var receptionists = await _userCommonRepository.GetAllReceptionistAsync();
                        var notifyReceptionists = receptionists.Select(r =>
                            _mediator.Send(new SendNotificationCommand(
                                    r.UserId,
                                    "Hoá đơn thanh toán",
                                    $"Hoá đơn thanh toán {invoice.OrderCode} của BN {patient.User.Fullname} đã được thanh toán.",
                                    "invoice", 0, $"invoices"),
                                cancellationToken));
                        await System.Threading.Tasks.Task.WhenAll(notifyReceptionists);
                    }
                    catch { }
                }
            }
        }

        // gửi mail // gửi notification
        return Unit.Value;
    }
}