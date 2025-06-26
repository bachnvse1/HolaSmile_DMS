using Application.Constants;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.UserCommon.ViewListPatient;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

public class ViewListPatientHandler : IRequestHandler<ViewListPatientCommand, List<ViewListPatientDto>>
{
    private readonly IPatientRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IHashIdService _hashIdService;

    public ViewListPatientHandler(
        IPatientRepository repository,
        IHttpContextAccessor httpContextAccessor,
        IHashIdService hashIdService)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
        _hashIdService = hashIdService;
    }

    public async Task<List<ViewListPatientDto>> Handle(ViewListPatientCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var userIdClaim = user?.FindFirst(ClaimTypes.NameIdentifier);
        var roleClaim = user?.FindFirst(ClaimTypes.Role);

        if (userIdClaim == null || roleClaim == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        if (roleClaim.Value == "Patient")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        var rawPatients = await _repository.GetAllPatientsAsync(cancellationToken);

        var result = rawPatients.Select(p => new ViewListPatientDto
        {
            UserId = p.UserId,
            PatientId = p.PatientId,
            Fullname = p.Fullname,
            Gender = p.Gender,
            Phone = p.Phone,
            DOB = p.DOB,
            Email = p.Email
        }).ToList();

        return result;
    }
}
