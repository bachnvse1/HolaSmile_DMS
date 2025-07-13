using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistant.ViewPrescriptionTemplate
{
    public class ViewPrescriptionTemplateHandler : IRequestHandler<ViewPrescriptionTemplateCommand, List<ViewPrescriptionTemplateDto>>
    {
        private readonly IPrescriptionTemplateRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewPrescriptionTemplateHandler(IPrescriptionTemplateRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<ViewPrescriptionTemplateDto>> Handle(ViewPrescriptionTemplateCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (user == null || (role != "Assistant" && role != "Dentist" && role != "Receptionist"))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            var templates = await _repository.GetAllAsync(cancellationToken);

            return templates.Select(t => new ViewPrescriptionTemplateDto
            {
                PreTemplateID = t.PreTemplateID,
                PreTemplateName = t.PreTemplateName,
                PreTemplateContext = t.PreTemplateContext,
                CreatedAt = t.CreatedAt,
            }).ToList();
        }
    }
}
