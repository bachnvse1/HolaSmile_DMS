using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Receptionist.ChangeAppointmentStatus
{
    public class ChangeAppointmentStatusHandler : IRequestHandler<ChangeAppointmentStatusCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IDentistRepository _dentistRepository;
        private readonly IMediator _mediator;

        public ChangeAppointmentStatusHandler(IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor, IPatientRepository patientRepository, IDentistRepository dentistRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _dentistRepository = dentistRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(ChangeAppointmentStatusCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            var existApp = await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId);
            if (existApp == null)
            {
                throw new Exception(MessageConstants.MSG.MSG28); // "Không tìm thấy lịch hẹn"
            }
            if (existApp.AppointmentDate.Date > DateTime.Now.Date || (existApp.AppointmentDate.Date == DateTime.Now.Date && existApp.AppointmentTime > DateTime.Now.TimeOfDay))
            {
                throw new Exception("Không thể đổi trạng thái lịch do chưa đến ngày"); // "Không thể đặt lịch hẹn ở thời gian quá khứ."
            }

            if (request.Status.ToLower() == "attended")
            {
                existApp.Status = "attended";
            }
            else if (request.Status.ToLower() == "absented")
            {
                existApp.Status = "absented";
            }

            existApp.UpdatedAt = DateTime.Now;
            existApp.UpdatedBy = currentUserId;

            var isUpdate = await _appointmentRepository.UpdateAppointmentAsync(existApp);

            try
            {
                var dentist = await _dentistRepository.GetDentistByDentistIdAsync(existApp.DentistId);
                var patient = await _patientRepository.GetPatientByPatientIdAsync(existApp.PatientId);

                await _mediator.Send(new SendNotificationCommand(
                      patient.User.UserID,
                      "Thay đổi trạng thái lịch",
                      $"Lễ tân đã thay đổi lịch hẹn {existApp.AppointmentId} với trạng thái bệnh nhân {(request.Status.ToLower() == "attended" ? "đã đến" : "vắng mặt")} vào lúc {DateTime.Now}",
                      "appointment", 0, $"appointments/{existApp.AppointmentId}"), cancellationToken);

                await _mediator.Send(new SendNotificationCommand(
                      dentist.User.UserID,
                      "Đặt lịch hẹn tái khám",
                      $"Lễ tân đã thay đổi lịch hẹn {existApp.AppointmentId} với trạng thái bệnh nhân {(request.Status.ToLower() == "attended" ? "đã đến" : "vắng mặt")} vào lúc {DateTime.Now}",
                      "appointment", 0, $"appointments/{existApp.AppointmentId}"), cancellationToken);
            }
            catch
            {
            }

            return isUpdate;
        }
    }
}
