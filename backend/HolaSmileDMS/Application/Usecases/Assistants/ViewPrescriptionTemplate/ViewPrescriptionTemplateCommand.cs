using MediatR;

namespace Application.Usecases.Assistant.ViewPrescriptionTemplate
{
    public class ViewPrescriptionTemplateCommand : IRequest<List<ViewPrescriptionTemplateDto>>
    {
    }
}