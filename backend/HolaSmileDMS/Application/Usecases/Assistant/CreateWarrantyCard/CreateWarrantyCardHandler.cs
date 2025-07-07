/*
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateWarrantyCard;
using Application.Usecases.SendNotification;
using HDMS_API.Application.Common.Helpers;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistant.CreateWarrantyCard
{
    public class CreateWarrantyCardHandler : IRequestHandler<CreateWarrantyCardCommand, CreateWarrantyCardDto>
    {
        private readonly IWarrantyCardRepository _warrantyRepository;
        private readonly IProcedureRepository _procedureRepository;
        private readonly ITreatmentRecordRepository _treatmentRecordRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly INotificationsRepository _notificationRepository;
        private readonly IMediator _mediator;

        public CreateWarrantyCardHandler(
            IWarrantyCardRepository warrantyRepository,
            IProcedureRepository procedureRepository,
            ITreatmentRecordRepository treatmentRecordRepository,
            IHttpContextAccessor httpContextAccessor,
            INotificationsRepository notificationsRepository,
            IMediator mediator)
        {
            _warrantyRepository = warrantyRepository;
            _procedureRepository = procedureRepository;
            _treatmentRecordRepository = treatmentRecordRepository;
            _httpContextAccessor = httpContextAccessor;
            _notificationRepository = notificationsRepository;
            _mediator = mediator;
        }

        public async Task<CreateWarrantyCardDto> Handle(CreateWarrantyCardCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

            if (role != "Assistant")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var procedure = await _procedureRepository.GetProcedureByIdAsync(request.ProcedureId, cancellationToken);
            if (procedure == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG99);

            if (procedure.WarrantyCardId != null)
                throw new InvalidOperationException(MessageConstants.MSG.MSG100);

            var treatmentRecord = await _treatmentRecordRepository.GetByProcedureIdAsync(request.ProcedureId, cancellationToken);
            if (treatmentRecord == null || treatmentRecord.TreatmentStatus?.ToLower() != "completed")
                throw new InvalidOperationException(MessageConstants.MSG.MSG101);

            var now = DateTime.Now;

            DateTime endDate;
            try
            {
                endDate = FormatHelper.ParseEndDateFromTerm(now, request.Term);
            }
            catch
            {
                throw new FormatException(MessageConstants.MSG.MSG98);
            }

            var card = new WarrantyCard
            {
                StartDate = now,
                EndDate = endDate,
                Term = request.Term,
                Status = true,
                CreateBy = int.TryParse(userId, out var uid) ? uid : null,
                Procedures = new List<Procedure> { procedure }
            };

            var createdCard = await _warrantyRepository.CreateWarrantyCardAsync(card, cancellationToken);

            procedure.WarrantyCardId = createdCard.WarrantyCardID;
            await _procedureRepository.UpdateProcedureAsync(procedure, cancellationToken);



            try
            {
                var patientId = treatmentRecord.Appointment?.PatientId;
                if (patientId.HasValue)
                {
                    var patient = await _treatmentRecordRepository.GetPatientByPatientIdAsync(patientId.Value);
                    var userIdNotification = patient?.UserID;

                    if (userIdNotification.HasValue)
                    {
                        await _notificationRepository.AddAsync(new Notification
                        {
                            UserId = userIdNotification.Value,
                            Title = "Thẻ bảo hành đã được tạo",
                            Message = $"Bạn đã được tạo thẻ bảo hành cho thủ thuật: {procedure.ProcedureName}",
                            Type = "warranty-card",
                            RelatedObjectId = createdCard.WarrantyCardID,
                            CreatedAt = DateTime.Now,
                            IsRead = false
                        }, cancellationToken);
                    }
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }


            return new CreateWarrantyCardDto
            {
                WarrantyCardId = createdCard.WarrantyCardID,
                StartDate = createdCard.StartDate,
                EndDate = createdCard.EndDate,
                Term = createdCard.Term,
                Status = createdCard.Status
            };
        }
    }
}
*/
