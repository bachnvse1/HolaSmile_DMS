using MediatR;

namespace Application.Usecases.Assistant.DeleteAndUndeleteSupply
{
    public class DeleteAndUndeleteSupplyCommand : IRequest<bool>
    {
        public int SupplyId { get; set; }
    }
}
