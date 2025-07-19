using MediatR;

namespace Application.Usecases.Assistants.DeleteInstructionTemplate;

public class DeactiveInstructionTemplateCommand : IRequest<string>
{
    public int Instruc_TemplateID { get; set; }
}