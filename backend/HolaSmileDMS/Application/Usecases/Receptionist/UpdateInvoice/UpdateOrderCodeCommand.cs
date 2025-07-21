using MediatR;

namespace Application.Usecases.Receptionist.UpdateInvoice;

public class UpdateOrderCodeCommand : IRequest<string>
{
    public string OrderCode { get; set; }
}