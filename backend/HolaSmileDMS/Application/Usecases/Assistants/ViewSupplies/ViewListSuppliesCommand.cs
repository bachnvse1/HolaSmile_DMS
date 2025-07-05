using MediatR;

namespace Application.Usecases.Assistants.ViewSupplies
{
    public class ViewListSuppliesCommand : IRequest<List<SuppliesDTO>>
    {
    }
}
