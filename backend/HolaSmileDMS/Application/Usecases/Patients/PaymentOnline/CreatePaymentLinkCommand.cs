using MediatR;

namespace Application.Usecases.Patients.PaymentOnline;

public class CreatePaymentLinkCommand : IRequest<string>
{
    public string OrderCode { get; set; }
}