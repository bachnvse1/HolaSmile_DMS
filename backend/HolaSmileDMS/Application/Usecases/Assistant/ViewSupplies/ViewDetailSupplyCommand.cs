using MediatR;

namespace Application.Usecases.Assistant.ViewSupplies
{
    public class ViewDetailSupplyCommand : IRequest<SuppliesDTO>
    {
        public int SupplyId { get; set; }
    }
}
