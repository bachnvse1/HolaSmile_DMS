using MediatR;

namespace Application.Usecases.Assistants.DeactiveInstruction
{
    public class DeactiveInstructionCommand : IRequest<string>
    {
        public int InstructionId { get; }

        public DeactiveInstructionCommand(int instructionId)
        {
            InstructionId = instructionId;
        }
    }
}