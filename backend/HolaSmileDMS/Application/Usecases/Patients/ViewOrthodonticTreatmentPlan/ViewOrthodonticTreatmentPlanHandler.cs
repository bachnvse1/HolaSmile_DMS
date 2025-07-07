using Application.Constants;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Application.Interfaces;
namespace Application.Usecases.Patients.ViewOrthodonticTreatmentPlan
{
    public class ViewOrthodonticTreatmentPlanHandler : IRequestHandler<ViewOrthodonticTreatmentPlanCommand, OrthodonticTreatmentPlanDto>
    {
        private readonly IOrthodonticTreatmentPlanRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserCommonRepository _userCommonRepository;

        public ViewOrthodonticTreatmentPlanHandler(
            IOrthodonticTreatmentPlanRepository repository,
            IHttpContextAccessor httpContextAccessor, IUserCommonRepository userCommonRepository)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _userCommonRepository = userCommonRepository;
        }

        public async Task<OrthodonticTreatmentPlanDto> Handle(ViewOrthodonticTreatmentPlanCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17); // Phiên làm việc hết hạn

            var userIdCurrent = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var role = user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
            
            if (role == "Patient")
            {
                var userId = await _userCommonRepository.GetUserIdByRoleTableIdAsync(role, request.PatientId ?? 0) ?? 0;
                if (userId == 0 || userId != userIdCurrent)
                    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền truy cập
            }
            else if (role != "Dentist" && role != "Receptionist" && role != "Assistant")
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền truy cập
            }

            var dto = await _repository.GetPlanByIdAsync(request.PlanId, request.PatientId ?? 0, cancellationToken);
            if (dto == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG27); // Không tìm thấy hồ sơ bệnh nhân

            return dto;
        }
    }
}
