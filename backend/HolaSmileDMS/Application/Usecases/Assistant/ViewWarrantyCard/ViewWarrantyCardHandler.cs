using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ViewWarrantyCard;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

public class ViewWarrantyCardHandler : IRequestHandler<ViewWarrantyCardCommand, ViewWarrantyCardDto>
{
    private readonly IWarrantyRepository _warrantyRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewWarrantyCardHandler(IWarrantyRepository warrantyRepository, IHttpContextAccessor httpContextAccessor)
    {
        _warrantyRepository = warrantyRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ViewWarrantyCardDto> Handle(ViewWarrantyCardCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;

        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        if (role != "Assistant")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        var warrantyCard = await _warrantyRepository.GetWarrantyCardByPatientIdAsync(request.PatientId, cancellationToken);

        if (warrantyCard == null || warrantyCard.TreatmentRecord == null)
            throw new KeyNotFoundException(MessageConstants.MSG.MSG16);

        var treatmentRecord = warrantyCard.TreatmentRecord;
        var dentistName = treatmentRecord.Dentist?.User?.Fullname ?? "Không xác định";

        return new ViewWarrantyCardDto
        {
            WarrantyCardId = warrantyCard.WarrantyCardID,
            ProcedureName = warrantyCard.Procedure?.ProcedureName ?? "Không xác định",
            StartDate = warrantyCard.StartDate,
            EndDate = warrantyCard.EndDate,
            Term = warrantyCard.Term,
            Status = warrantyCard.Status,
            TreatmentRecordId = treatmentRecord.TreatmentRecordID,
            TreatmentDate = treatmentRecord.TreatmentDate,
            Symptoms = treatmentRecord.Symptoms,
            Diagnosis = treatmentRecord.Diagnosis,
            DentistName = dentistName
        };
    }
}
