using System.Text.Json;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.Patients.PaymentOnline;
using MediatR;
using Microsoft.Extensions.Configuration;

public sealed class UpdateInvoiceFromWebhookHandler : IRequestHandler<UpdateInvoiceFromWebhookCommand, Unit>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IConfiguration _configuration;
    private readonly IPayOSService _payOsService;

    public UpdateInvoiceFromWebhookHandler(
        IInvoiceRepository invoiceRepository,
        IConfiguration configuration,
        IPayOSService payOsService)
    {
        _invoiceRepository = invoiceRepository;
        _configuration = configuration;
        _payOsService = payOsService;
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
        }

        return Unit.Value;
    }
}