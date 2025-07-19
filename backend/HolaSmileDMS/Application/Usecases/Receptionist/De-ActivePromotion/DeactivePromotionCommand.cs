using MediatR;

namespace Application.Usecases.Receptionist.De_ActivePromotion
{
    public class DeactivePromotionCommand : IRequest<bool>
    {
        public int ProgramId { get; set; }
        public DeactivePromotionCommand(int programId)
        {
            ProgramId = programId;
        }
    }
}
