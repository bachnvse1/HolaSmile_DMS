using Application.Interfaces;
using MediatR;

namespace Application.Usecases.Assistant.ViewPrescriptionTemplate
{
    public class ViewPrescriptionTemplateHandler : IRequestHandler<ViewPrescriptionTemplateCommand, List<ViewPrescriptionTemplateDto>>
    {
        private readonly IPrescriptionTemplateRepository _repository;

        public ViewPrescriptionTemplateHandler(IPrescriptionTemplateRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<ViewPrescriptionTemplateDto>> Handle(ViewPrescriptionTemplateCommand request, CancellationToken cancellationToken)
        {
            var templates = await _repository.GetAllAsync(cancellationToken);

            return templates.Select(t => new ViewPrescriptionTemplateDto
            {
                PreTemplateID = t.PreTemplateID,
                PreTemplateName = t.PreTemplateName,
                PreTemplateContext = t.PreTemplateContext,
                CreatedAt = t.CreatedAt
            }).ToList();
        }
    }
}
