using MediatR;

namespace Application.Usecases.Assistants.UpdateInstruction
{
    public class UpdateInstructionCommand : IRequest<string>
    {
        public int InstructionId { get; set; }
        public string? Content { get; set; }
        public int? Instruc_TemplateID { get; set; }
    }
}