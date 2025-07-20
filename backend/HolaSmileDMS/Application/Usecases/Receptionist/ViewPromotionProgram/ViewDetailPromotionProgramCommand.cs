using MediatR;
namespace Application.Usecases.Receptionist.ViewPromotionProgram
{
    public class ViewDetailPromotionProgramCommand : IRequest<ViewPromotionResponse>
    {
        public int DiscountProgramId { get; set; }
        public ViewDetailPromotionProgramCommand(int discountProgramId)
        {
            DiscountProgramId = discountProgramId;
        }
    }
}
