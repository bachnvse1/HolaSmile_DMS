using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace Application.Usecases.Assistant.EditWarrantyCard
{
    public class EditWarrantyCardHandler : IRequestHandler<EditWarrantyCardCommand, string>
    {
        private readonly IWarrantyCardRepository _warrantyRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;

        public EditWarrantyCardHandler(
            IWarrantyCardRepository warrantyRepository,
            IHttpContextAccessor httpContextAccessor,
            IMediator mediator)
        {
            _warrantyRepository = warrantyRepository;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;
        }

        public async Task<string> Handle(EditWarrantyCardCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);

            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (role != "Assistant" && role != "Dentist" && role != "Receptionist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var card = await _warrantyRepository.GetByIdAsync(request.WarrantyCardId, cancellationToken);
            if (card == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG103);

            if (!request.Duration.HasValue || request.Duration <= 0 )
                throw new ArgumentException(MessageConstants.MSG.MSG98);

            card.Duration = request.Duration;
            card.EndDate = card.StartDate.AddMonths(request.Duration.Value);
            card.Status = request.Status;
            card.UpdatedAt = DateTime.Now;
            card.UpdatedBy = int.TryParse(userId, out var uid) ? uid : null;

            await _warrantyRepository.UpdateWarrantyCardAsync(card, cancellationToken);
            
            // Gửi notification cho bệnh nhân
            try
            {
                if (card.TreatmentRecord?.Appointment?.PatientId != null)
                {
                    var patientUserId = card.TreatmentRecord.Appointment.Patient?.UserID ?? 0;
                    if (patientUserId > 0)
                    {
                        await _mediator.Send(new SendNotificationCommand(
                            patientUserId,
                            "Cập nhật thẻ bảo hành",
                            $"Thẻ bảo hành của bạn đã được cập nhật. Thời hạn mới: {card.Duration} tháng.",
                            "Update",
                            card.WarrantyCardID,
                            $"/patient/warranty-cards/{card.WarrantyCardID}"
                        ), cancellationToken);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification Error] {ex.Message}");
            }
            return MessageConstants.MSG.MSG106;
        }
    }
}
