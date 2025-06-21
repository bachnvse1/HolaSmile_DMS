using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patients.ViewTreatmentRecord;

public class ViewPatientTreatmentRecordHandler : IRequestHandler<ViewTreatmentRecordsCommand, List<ViewTreatmentRecordDto>>
{
    private readonly ITreatmentRecordRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewPatientTreatmentRecordHandler(ITreatmentRecordRepository repository, IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<List<ViewTreatmentRecordDto>> Handle(ViewTreatmentRecordsCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var currentRole = user?.FindFirst(ClaimTypes.Role)?.Value;
        
        var isDentist = currentRole == "Dentist";
        var isSelfPatient = currentRole == "Patient" && currentUserId == request.UserId;

        if (!isDentist && !isSelfPatient)
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập hồ sơ điều trị này.");

        return await _repository.GetPatientTreatmentRecordsAsync(request.UserId, cancellationToken);
    }
}