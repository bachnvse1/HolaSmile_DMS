using MediatR;

namespace Application.Usecases.Assistants.CreateInstructionTemplete;

public class CreateInstructionTemplateCommand : IRequest<string>
{
    public string Instruc_TemplateName { get; set; }
    public string Instruc_TemplateContext { get; set; }
}