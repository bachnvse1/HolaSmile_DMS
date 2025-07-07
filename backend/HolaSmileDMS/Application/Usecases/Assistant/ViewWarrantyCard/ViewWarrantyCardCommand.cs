using Application.Usecases.Assistant.ViewListWarrantyCards;
using MediatR;

namespace Application.Usecases.Assistant.ViewListWarrantyCards
{
    public class ViewListWarrantyCardsCommand : IRequest<List<ViewWarrantyCardDto>>
    {
    }
}
    