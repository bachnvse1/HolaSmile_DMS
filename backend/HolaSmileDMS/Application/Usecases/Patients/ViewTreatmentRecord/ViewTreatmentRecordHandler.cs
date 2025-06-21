using System.Security.Claims;
using Application.Constants;
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
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Bạn không có quyền truy cập chức năng này

        var records = await _repository.GetPatientTreatmentRecordsAsync(request.UserId, cancellationToken);

        if (records == null || records.Count == 0)
            throw new KeyNotFoundException(MessageConstants.MSG.MSG16); // Không có dữ liệu phù hợp

        return records;
    }
}