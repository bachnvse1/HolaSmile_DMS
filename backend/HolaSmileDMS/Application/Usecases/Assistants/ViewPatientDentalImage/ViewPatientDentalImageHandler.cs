using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Application.Usecases.Assistants.ViewPatientDentalImage
{
    public class ViewPatientDentalImageHandler : IRequestHandler<ViewPatientDentalImageCommand, List<ViewPatientDentalImageDto>>
    {
        private readonly IImageRepository _imageRepo;
        private readonly IHttpContextAccessor _httpContext;

        public ViewPatientDentalImageHandler(IImageRepository imageRepo, IHttpContextAccessor httpContext)
        {
            _imageRepo = imageRepo;
            _httpContext = httpContext;
        }

        public async Task<List<ViewPatientDentalImageDto>> Handle(ViewPatientDentalImageCommand request, CancellationToken cancellationToken)
        {
            var role = _httpContext.HttpContext.User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Assistant" && role != "Dentist" && role != "Patient")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var query = _imageRepo.Query()
                .Include(i => i.TreatmentRecord).ThenInclude(tr => tr.Procedure)
                .Include(i => i.OrthodonticTreatmentPlan)
                .Where(i => i.PatientId == request.PatientId && !i.IsDeleted);

            if (request.TreatmentRecordId != null)
                query = query.Where(i => i.TreatmentRecordId == request.TreatmentRecordId);

            if (request.OrthodonticTreatmentPlanId != null)
                query = query.Where(i => i.OrthodonticTreatmentPlanId == request.OrthodonticTreatmentPlanId);

            var images = await query.ToListAsync(cancellationToken);

            var result = images.Select(i => new ViewPatientDentalImageDto
            {
                ImageId = i.ImageId,
                ImageURL = i.ImageURL,
                Description = i.Description,
                TreatmentRecordId = i.TreatmentRecordId,
                OrthodonticTreatmentPlanId = i.OrthodonticTreatmentPlanId,
                ProcedureName = i.TreatmentRecord?.Procedure?.ProcedureName,
                PlanTitle = i.OrthodonticTreatmentPlan?.PlanTitle,
                TemplateName = i.OrthodonticTreatmentPlan?.TemplateName,
                CreatedAt = i.CreatedAt
            }).ToList();

            return result;
        }
    }
}
