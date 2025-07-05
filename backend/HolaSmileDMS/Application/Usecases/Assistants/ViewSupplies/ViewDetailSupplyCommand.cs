using MediatR;

namespace Application.Usecases.Assistants.ViewSupplies
{
    public class ViewDetailSupplyCommand : IRequest<SuppliesDTO>
    {
        public int SupplyId { get; set; }
    }
}
