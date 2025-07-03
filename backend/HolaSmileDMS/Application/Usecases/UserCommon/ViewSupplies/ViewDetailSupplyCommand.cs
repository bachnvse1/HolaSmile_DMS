using MediatR;

namespace Application.Usecases.UserCommon.ViewSupplies
{
    public class ViewDetailSupplyCommand : IRequest<SuppliesDTO>
    {
        public int SupplyId { get; set; }
    }
}
