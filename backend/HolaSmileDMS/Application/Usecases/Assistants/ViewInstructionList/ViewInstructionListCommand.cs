using MediatR;

namespace Application.Usecases.Assistants.ViewInstructionList
{
    public class ViewInstructionListCommand : IRequest<List<ViewInstructionListDto>>
    {
        public int AppointmentId { get; set; }
    }
}
