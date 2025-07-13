using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.ViewAllOrthodonticTreatmentPlan;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

public class ViewAllOrthodonticTreatmentPlanHandler 
    : IRequestHandler<ViewAllOrthodonticTreatmentPlanCommand, List<ViewOrthodonticTreatmentPlanDto>>
{
    private readonly IOrthodonticTreatmentPlanRepository _repository;
    private readonly IUserCommonRepository _userRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;

    public ViewAllOrthodonticTreatmentPlanHandler(
        IOrthodonticTreatmentPlanRepository repository,
        IHttpContextAccessor httpContextAccessor,
        IMapper mapper, IUserCommonRepository userRepository)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
        _mapper = mapper;
        _userRepository = userRepository;
    }

    public async Task<List<ViewOrthodonticTreatmentPlanDto>> Handle(
        ViewAllOrthodonticTreatmentPlanCommand request,
        CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User
                   ?? throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);

        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        var isPatient = role == "Patient";
        var isAllowedRole = role is "Dentist" or "Assistant" or "Receptionist" or "Owner";

        int patientId;

        if (isPatient)
        {
            var patientIdClaim = user.FindFirst("role_table_id")?.Value;
            if (!int.TryParse(patientIdClaim, out patientId))
                throw new KeyNotFoundException(MessageConstants.MSG.MSG27);

            // ✅ Đảm bảo không ai fake PatientId gửi vào request để xem của người khác
            if (request.PatientId != 0 && request.PatientId != patientId)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Truy cập sai bệnh nhân
        }
        else if (isAllowedRole)
        {
            if (request.PatientId <= 0)
                throw new ArgumentException(MessageConstants.MSG.MSG07); // Thiếu patientId

            patientId = request.PatientId;
        }
        else
        {
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
        }

        var plans = await _repository.GetAllByPatientIdAsync(patientId, cancellationToken);
        if (plans == null || !plans.Any())
            throw new KeyNotFoundException(MessageConstants.MSG.MSG16);
        var result =  _mapper.Map<List<ViewOrthodonticTreatmentPlanDto>>(plans);
        foreach (var plan in result)
        {
            if (plan.CreatedBy.HasValue)
            {
                var creator = await _userRepository.GetByIdAsync(plan.CreatedBy.Value, cancellationToken);
                plan.CreatedByName = creator?.Fullname;
            }

            if (plan.UpdatedBy.HasValue)
            {
                var updater = await _userRepository.GetByIdAsync(plan.UpdatedBy.Value, cancellationToken);
                plan.UpdatedByName = updater?.Fullname;
            }
        }

        return result;
    }
}