using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Text.Json;

namespace Application.Usecases.Assistant.DeactiveWarrantyCard
{
    public class DeactiveWarrantyCardHandler : IRequestHandler<DeactiveWarrantyCardCommand, string>
    {
        private readonly IWarrantyCardRepository _warrantyRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;

        public DeactiveWarrantyCardHandler(
            IWarrantyCardRepository warrantyRepository,
            IHttpContextAccessor httpContextAccessor,
            IMediator mediator)
        {
            _warrantyRepository = warrantyRepository;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;
        }

        public async Task<string> Handle(DeactiveWarrantyCardCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);

            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (user == null || (role != "Assistant" && role != "Dentist" && role != "Receptionist"))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var warrantyCard = await _warrantyRepository.GetByIdAsync(request.WarrantyCardId, cancellationToken);
            if (warrantyCard == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG103);

            if (warrantyCard.Status == false)
                throw new InvalidOperationException(MessageConstants.MSG.MSG104);

            warrantyCard.Status = false;
            warrantyCard.UpdatedAt = DateTime.Now;
            warrantyCard.UpdatedBy = int.TryParse(userId, out var uid) ? uid : null;

            var result = await _warrantyRepository.DeactiveWarrantyCardAsync(warrantyCard, cancellationToken);
            if (!result)
                throw new Exception(MessageConstants.MSG.MSG58);

            // Gửi notification trong try/catch
            try
            {
                Console.WriteLine($"WarrantyCard ID: {warrantyCard.WarrantyCardID}");
                Console.WriteLine($"TreatmentRecord: {(warrantyCard.TreatmentRecord != null ? "exists" : "null")}");

                if (warrantyCard.TreatmentRecord != null)
                {
                    Console.WriteLine($"TreatmentRecord ID: {warrantyCard.TreatmentRecord.TreatmentRecordID}");
                    Console.WriteLine($"Appointment: {(warrantyCard.TreatmentRecord.Appointment != null ? "exists" : "null")}");

                    if (warrantyCard.TreatmentRecord.Appointment != null)
                    {
                        Console.WriteLine($"Patient: {(warrantyCard.TreatmentRecord.Appointment.Patient != null ? "exists" : "null")}");

                        if (warrantyCard.TreatmentRecord.Appointment.Patient != null)
                        {
                            Console.WriteLine($"User: {(warrantyCard.TreatmentRecord.Appointment.Patient.User != null ? "exists" : "null")}");
                            Console.WriteLine($"User ID: {warrantyCard.TreatmentRecord.Appointment.Patient.User?.UserID}");
                        }
                    }
                }

                var patientUserId = warrantyCard.TreatmentRecord?.Appointment?.Patient?.User?.UserID;
                Console.WriteLine($"Final Patient User ID: {patientUserId}");

                if (patientUserId.HasValue && patientUserId.Value > 0)
                {
                    var notification = new SendNotificationCommand(
                        patientUserId.Value,
                        "Vô hiệu hóa thẻ bảo hành",
                        "Thẻ bảo hành của bạn đã bị vô hiệu hóa.",
                        "Delete",
                        warrantyCard.TreatmentRecordID,
                        $"/patient/treatment-records/{warrantyCard.TreatmentRecordID}/warranty"
                    );

                    Console.WriteLine($"Preparing to send notification to user {patientUserId.Value}");
                    await _mediator.Send(notification, cancellationToken);
                    Console.WriteLine("Notification sent successfully");
                }
                else
                {
                    Console.WriteLine("Patient User ID is invalid or not found");
                }
            }
            catch (Exception ex)
            {
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
            }

            return MessageConstants.MSG.MSG105;
        }
    }
}