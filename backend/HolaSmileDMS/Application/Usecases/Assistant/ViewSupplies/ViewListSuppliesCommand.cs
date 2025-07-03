using MediatR;

namespace Application.Usecases.Assistant.ViewSupplies
{
    public class ViewListSuppliesCommand : IRequest<List<SuppliesDTO>>
    {
    }
}
