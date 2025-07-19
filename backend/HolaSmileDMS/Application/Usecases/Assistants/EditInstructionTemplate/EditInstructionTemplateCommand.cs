using MediatR;

namespace Application.Usecases.Assistants.EditInstructionTemplate;

public class EditInstructionTemplateCommand : IRequest<string>
{
    public int Instruc_TemplateID { get; set; }
    public string Instruc_TemplateName { get; set; }
    public string Instruc_TemplateContext { get; set; }
}