using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateWarrantyCard;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Application.Usecases.Assistant.CreateWarrantyCard
{
    public class CreateWarrantyCardHandler : IRequestHandler<CreateWarrantyCardCommand, CreateWarrantyCardDto>
    {
        private readonly IWarrantyCardRepository _warrantyRepo;
        private readonly ITreatmentRecordRepository _treatmentRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly INotificationsRepository _notificationRepo;

        public CreateWarrantyCardHandler(
            IWarrantyCardRepository warrantyRepo,
            ITreatmentRecordRepository treatmentRepo,
            IHttpContextAccessor httpContextAccessor,
            INotificationsRepository notificationRepo)
        {
            _warrantyRepo = warrantyRepo;
            _treatmentRepo = treatmentRepo;
            _httpContextAccessor = httpContextAccessor;
            _notificationRepo = notificationRepo;
        }

        public async Task<CreateWarrantyCardDto> Handle(CreateWarrantyCardCommand request, CancellationToken ct)
        {
            var user = _httpContextAccessor.HttpContext?.User
                       ?? throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (user == null || (role != "Assistant" && role != "Dentist" && role != "Receptionist"))  
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var userId = int.TryParse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : (int?)null;

            var treatmentRecord = await _treatmentRepo
                .Query()
                .Include(tr => tr.Procedure)
                .Include(tr => tr.Appointment)
                .FirstOrDefaultAsync(tr => tr.TreatmentRecordID == request.TreatmentRecordId && !tr.IsDeleted, ct)
                ?? throw new KeyNotFoundException(MessageConstants.MSG.MSG101);

            if (!string.Equals(treatmentRecord.TreatmentStatus.ToLower(), "completed", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(MessageConstants.MSG.MSG101);

            var procedure = treatmentRecord.Procedure
                           ?? throw new InvalidOperationException(MessageConstants.MSG.MSG99);

            var allCards = await _warrantyRepo.GetAllAsync(ct);
            if (allCards.Any(c => c.TreatmentRecordID == treatmentRecord.TreatmentRecordID))
                throw new InvalidOperationException(MessageConstants.MSG.MSG100);

            if (request.Duration <= 0)
                throw new FormatException(MessageConstants.MSG.MSG98);

            var now = DateTime.Now;
            var endDate = now.AddMonths(request.Duration);

            var card = new WarrantyCard
            {
                StartDate = now,
                EndDate = endDate,
                Duration = request.Duration,
                Status = true,
                CreateBy = userId,
                TreatmentRecordID = treatmentRecord.TreatmentRecordID
            };

            var createdCard = await _warrantyRepo.CreateWarrantyCardAsync(card, ct);

            try
            {
                var patientId = treatmentRecord.Appointment?.PatientId;
                if (patientId.HasValue)
                {
                    var patient = await _treatmentRepo.GetPatientByPatientIdAsync(patientId.Value);
                    if (patient?.UserID is int notifyUserId)
                    {
                        await _notificationRepo.AddAsync(new Notification
                        {
                            UserId = notifyUserId,
                            Title = "Thẻ bảo hành đã được tạo",
                            Message = $"Bạn đã được tạo thẻ bảo hành cho thủ thuật: {procedure.ProcedureName}",
                            Type = "warranty-card",
                            RelatedObjectId = createdCard.WarrantyCardID,
                            CreatedAt = now,
                            IsRead = false
                        }, ct);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification Error] {ex.Message}");
            }

            return new CreateWarrantyCardDto
            {
                WarrantyCardId = createdCard.WarrantyCardID,
                StartDate = createdCard.StartDate,
                EndDate = createdCard.EndDate,
                Duration = createdCard.Duration ?? 0,
                Status = createdCard.Status
            };
        }
    }
}
