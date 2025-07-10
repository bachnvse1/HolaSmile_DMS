using MediatR;

namespace Application.Usecases.Assistants.UpdatePrescriptionTemplate
{
    public class UpdatePrescriptionTemplateCommand : IRequest<string>
    {
        public int PreTemplateID { get; set; }
        public string? PreTemplateName { get; set; }
        public string? PreTemplateContext { get; set; }
    }
}
