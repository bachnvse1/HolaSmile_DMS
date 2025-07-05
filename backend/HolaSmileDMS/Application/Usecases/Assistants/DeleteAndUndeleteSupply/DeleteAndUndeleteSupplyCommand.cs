using MediatR;

namespace Application.Usecases.Assistants.DeleteAndUndeleteSupply
{
    public class DeleteAndUndeleteSupplyCommand : IRequest<bool>
    {
        public int SupplyId { get; set; }
    }
}
