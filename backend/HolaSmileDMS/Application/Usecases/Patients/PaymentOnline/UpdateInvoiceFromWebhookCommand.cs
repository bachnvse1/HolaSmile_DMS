using MediatR;

namespace Application.Usecases.Patients.PaymentOnline;

public sealed record UpdateInvoiceFromWebhookCommand(string RawJson) : IRequest<Unit>;