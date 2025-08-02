using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Dentists.CreatePrescription
{
    public class CreatePrescriptionHandler : IRequestHandler<CreatePrescriptionCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IMediator _mediator;
        public CreatePrescriptionHandler(IHttpContextAccessor httpContextAccessor, IPrescriptionRepository prescriptionRepository, IAppointmentRepository appointmentRepository, IPatientRepository patientRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _appointmentRepository = appointmentRepository;
            _prescriptionRepository = prescriptionRepository;
            _patientRepository = patientRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(CreatePrescriptionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            //Check if the user is not a dentist return failed message
            if (!string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            var existApp = await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId) ?? throw new Exception(MessageConstants.MSG.MSG28);

            if (existApp.Status != "attended") throw new Exception("Bạn chỉ có thể tạo đơn thuốc với khi khách đã đến");

            var existPrescription = await _prescriptionRepository.GetPrescriptionByAppointmentIdAsync(request.AppointmentId);
            if (existPrescription != null) throw new Exception(MessageConstants.MSG.MSG108);

            if (string.IsNullOrEmpty(request.contents.Trim())) throw new Exception(MessageConstants.MSG.MSG07);  // "Vui lòng nhập thông tin bắt buộc"

            var prescription = new Prescription
            {
                AppointmentId = request.AppointmentId,
                Content = request.contents,
                CreateBy = currentUserId,
                CreatedAt = DateTime.Now,
                IsDeleted = false
            };
            var isCreated = await _prescriptionRepository.CreatePrescriptionAsync(prescription);
            
            try
            {
                var patient = await _patientRepository.GetPatientByPatientIdAsync(existApp.PatientId);
                await _mediator.Send(new SendNotificationCommand(
                      patient.User.UserID,
                      "Taọ đơn thuốc",
                      $"Bác sĩ đã tạo đơn thuốc cho cuộc hẹn ngày {existApp.AppointmentDate} vào lúc {DateTime.Now}",
                      "schedule",
                      0, $"patient/appointments/{existApp.AppointmentId}"), cancellationToken);
            }
            catch { }
            return isCreated;
        }
    }
}
