using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;

namespace Application.Usecases.Patients.ViewTreatmentProgress;

public class ViewTreatmentProgressHandler : IRequestHandler<ViewTreatmentProgressCommand, List<ViewTreatmentProgressDto>>
{
    private readonly ITreatmentProgressRepository _repository;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewTreatmentProgressHandler(
        ITreatmentProgressRepository repository,
        IMapper mapper,
        IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _mapper = mapper;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<List<ViewTreatmentProgressDto>> Handle(ViewTreatmentProgressCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(role))
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Bạn không có quyền truy cập chức năng này

        // Lấy danh sách tiến trình điều trị theo TreatmentRecordId
        var progresses = await _repository.GetByTreatmentRecordIdAsync(request.TreatmentRecordId, cancellationToken);

        if (progresses == null || !progresses.Any())
            throw new KeyNotFoundException(MessageConstants.MSG.MSG16); // Không có dữ liệu phù hợp

        switch (role)
        {
            case "Patient":
                // Bệnh nhân chỉ được xem tiến trình của chính mình
                if (!progresses.All(p => p.Patient.UserID == userId))
                    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
                break;

            case "Dentist":
            case "Assistant":
            case "Receptionist":
            case "Owner":
                // Toàn quyền truy cập
                break;

            default:
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
        }

        return _mapper.Map<List<ViewTreatmentProgressDto>>(progresses);
    }
}