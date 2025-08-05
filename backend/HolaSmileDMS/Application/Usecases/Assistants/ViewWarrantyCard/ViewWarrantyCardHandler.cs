﻿using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ViewListWarrantyCards;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

public class ViewListWarrantyCardsHandler : IRequestHandler<ViewListWarrantyCardsCommand, List<ViewWarrantyCardDto>>
{
    private readonly IWarrantyCardRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewListWarrantyCardsHandler(IWarrantyCardRepository repository, IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<List<ViewWarrantyCardDto>> Handle(ViewListWarrantyCardsCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;

        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        if (role != "Assistant" && role != "Dentist" && role != "Receptionist" && role != "Patient")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        var cards = await _repository.GetAllWarrantyCardsWithProceduresAsync(cancellationToken);

        // Nếu là Patient, lọc chỉ lấy warranty card của họ
        if (role == "Patient")
        {
            var patientUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            cards = cards.Where(card =>
                card.TreatmentRecord?.Appointment?.Patient?.User?.UserID == patientUserId
            ).ToList();
        }

        return cards.Select(card =>
        {
            var treatment = card.TreatmentRecord;
            var procedure = treatment?.Procedure;
            var appointment = treatment?.Appointment;
            var patientName = appointment?.Patient?.User?.Fullname ?? "Không xác định";
            return new ViewWarrantyCardDto
            {
                WarrantyCardId = card.WarrantyCardID,
                StartDate = card.StartDate,
                EndDate = card.EndDate,
                Duration = card.Duration,
                Status = card.Status,
                ProcedureId = procedure?.ProcedureId,
                ProcedureName = procedure?.ProcedureName ?? "Không xác định",
                PatientName = patientName,
                TreatmentRecordId = treatment.TreatmentRecordID
            };
        }).ToList();
    }
}