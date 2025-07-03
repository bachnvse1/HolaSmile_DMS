using MediatR;

namespace Application.Usecases.UserCommon.ViewSupplies
{
    public class ViewListSuppliesCommand : IRequest<List<SuppliesDTO>>
    {
    }
}
