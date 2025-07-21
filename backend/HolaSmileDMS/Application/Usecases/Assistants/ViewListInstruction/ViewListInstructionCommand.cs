using MediatR;

namespace Application.Usecases.Assistants.ViewListInstruction
{
    public class ViewListInstructionCommand : IRequest<List<ViewListInstructionDto>>
    {
    }
}
