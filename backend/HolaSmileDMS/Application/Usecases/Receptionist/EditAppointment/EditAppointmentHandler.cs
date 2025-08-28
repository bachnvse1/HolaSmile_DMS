using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Receptionist.EditAppointment
{
    public class EditAppointmentHandler : IRequestHandler<EditAppointmentCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IDentistRepository _dentistRepository;
        private readonly IMediator _mediator;


        public EditAppointmentHandler(IAppointmentRepository appointmentRepository, IMediator mediator, IHttpContextAccessor httpContextAccessor, IPatientRepository patientRepository, IDentistRepository dentistRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _dentistRepository = dentistRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(EditAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            var existApp = await _appointmentRepository.GetAppointmentByIdAsync(request.appointmentId);
            if (existApp == null)
            {
                throw new Exception(MessageConstants.MSG.MSG28); // "Không tìm thấy lịch hẹn"
            }

            if(existApp.Status.ToLower() != "confirmed")
            {
                throw new Exception("Lịch hẹn đang ở trạng thái không thể thay đổi");
            }

            if (request.AppointmentDate.Date < DateTime.Now.Date)
            {
                throw new Exception(MessageConstants.MSG.MSG34); // "Ngày hẹn phải sau ngày hôm nay"
            }

            var appointmentDateTime = request.AppointmentDate.Date + request.AppointmentTime;
            var appointmentEndtime = appointmentDateTime.AddHours(3);
            if (appointmentEndtime < DateTime.Now)
            {
                throw new Exception(MessageConstants.MSG.MSG74); // "Không thể đặt lịch hẹn ở thời gian quá khứ."
            }

            if (await _dentistRepository.GetDentistByDentistIdAsync(request.DentistId) == null)
            {
                throw new Exception(MessageConstants.MSG.MSG16); // "Bác sĩ không tồn tại"
            }

            existApp.DentistId = request.DentistId;
            existApp.AppointmentDate = request.AppointmentDate;
            existApp.AppointmentTime = request.AppointmentTime;
            existApp.Content = request.ReasonForFollowUp;
            existApp.UpdatedAt = DateTime.Now;
            existApp.UpdatedBy = currentUserId;

            var isUpdate = await _appointmentRepository.UpdateAppointmentAsync(existApp);
            try
            {
                var newDentist = await _dentistRepository.GetDentistByDentistIdAsync(request.DentistId);
                var currentDentist = await _dentistRepository.GetDentistByDentistIdAsync(existApp.DentistId);
                var currentPatient = await _patientRepository.GetPatientByPatientIdAsync(existApp.PatientId);

                if(newDentist.DentistId != currentDentist.DentistId)
                {
                    await _mediator.Send(new SendNotificationCommand(
                        newDentist.User.UserID,
                        "Thay đổi thông tin lịch khám",
                        $"Lịch hẹn #{existApp.AppointmentId} đã được lễ tân thay đổi sang ngày {request.AppointmentDate.ToString("dd/MM/yyyy")} {request.AppointmentTime}.",
                        "appointment", 0, $"appointments/{existApp.AppointmentId}"),
                 cancellationToken);
                }

                await _mediator.Send(new SendNotificationCommand(
                    currentPatient.User.UserID,
                   "Thay đổi thông tin lịch khám",
                   $"Lịch khám #{existApp.AppointmentId} đã được thay đổi sang ngày {request.AppointmentDate.ToString("dd/MM/yyyy")} {request.AppointmentTime}.",
                   "appointment", 0, $"patient/appointments/{existApp.AppointmentId}"),
             cancellationToken);

                await _mediator.Send(new SendNotificationCommand(
                        currentDentist.User.UserID,
                        "Thay đổi thông tin lịch khám",
                         $"Lịch khám #{existApp.AppointmentId} đã được thay đổi sang ngày {request.AppointmentDate.ToString("dd/MM/yyyy")} {request.AppointmentTime}.",
                        "appointment", 0, $"patient/appointments/{existApp.AppointmentId}"),
                 cancellationToken);
            }
            catch { }

            return isUpdate;
        }
    }
}
