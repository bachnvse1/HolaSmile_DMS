using MediatR;

namespace Application.Usecases.Assistants.DeactivePrescriptionTemplate
{
    public class DeactivePrescriptionTemplateCommand : IRequest<string>
    {
        public int PreTemplateID { get; set; }
    }
}
