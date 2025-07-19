using Domain.Entities;
using MediatR;

namespace Application.Usecases.Receptionist.ViewPromotionProgram
{
    public class ViewPromotionProgramCommand : IRequest<List<DiscountProgram>>
    {
    }
}
