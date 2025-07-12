using MediatR;

namespace Application.Usecases.Assistants.CreatePrescriptionTemplate
{
    public class CreatePrescriptionTemplateCommand : IRequest<string>
    {
        public string? PreTemplateName { get; set; }
        public string? PreTemplateContext { get; set; }
    }
}
