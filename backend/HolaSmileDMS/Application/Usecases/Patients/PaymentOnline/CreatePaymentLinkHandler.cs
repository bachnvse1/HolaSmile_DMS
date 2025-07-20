using Application.Interfaces;
using Application.Services;
using Azure;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Net.payOS;
using Net.payOS.Types;

namespace Application.Usecases.Patients.PaymentOnline;

public class CreatePaymentLinkHandler : IRequestHandler<CreatePaymentLinkCommand, string>
{
    private readonly IInvoiceRepository _invoiceRepo;
    private readonly IPayOSConfiguration _config;
    private readonly IConfiguration _configuration;

    public CreatePaymentLinkHandler(
        IInvoiceRepository invoiceRepo,
        IConfiguration configuration,
        IPayOSConfiguration config)
    {
        _invoiceRepo = invoiceRepo;
        _configuration = configuration;
        _config = config;
    }

    public async Task<string> Handle(CreatePaymentLinkCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _invoiceRepo.GetByOrderCodeAsync(request.OrderCode, cancellationToken);
        if (invoice == null) throw new Exception("Không tìm thấy hoá đơn");
        var domain = _configuration["Frontend:Domain"]; // 👈 lấy từ appsettings.json
        if (string.IsNullOrWhiteSpace(domain)) domain = "http://localhost:5173/";

        var payOS = new PayOS(_config.ClientId, _config.ApiKey, _config.ChecksumKey);
        if (!long.TryParse(invoice.OrderCode, out var orderCode))
            throw new Exception("OrderCode không hợp lệ để tạo thanh toán");
        
        int amount = Convert.ToInt32(Math.Round(invoice.PaidAmount ?? 0));
        
        var paymentData = new PaymentData(
            orderCode: orderCode,
            amount: amount,
            description: "Thanh toán điều trị",
            returnUrl: $"{domain}thank-you",
            cancelUrl: $"{domain}cancel",
            buyerName: "Patient #" + invoice.Patient.User.Fullname,
            buyerEmail: "",
            buyerPhone: "",
            expiredAt: null,
            items: null,
            signature: ""
        );
        var response = await payOS.createPaymentLink(paymentData);

        return response.checkoutUrl!;
    }
}