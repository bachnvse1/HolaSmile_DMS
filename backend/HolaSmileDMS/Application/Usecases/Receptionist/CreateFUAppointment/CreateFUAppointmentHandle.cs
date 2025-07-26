using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.CreateFUAppointment
{
    public class CreateFUAppointmentHandle : IRequestHandler<CreateFUAppointmentCommand, string>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IDentistRepository _dentistRepository;
        private readonly IMediator _mediator;


        public CreateFUAppointmentHandle(IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor, IPatientRepository patientRepository, IDentistRepository dentistRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _dentistRepository = dentistRepository;
            _mediator = mediator;
        }
        public async Task<string> Handle(CreateFUAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }
            if (request.AppointmentDate < DateTime.Now.Date)
            {
                throw new Exception(MessageConstants.MSG.MSG34); // "Ngày hẹn tái khám phải sau ngày hôm nay"
            }
            if (request.AppointmentDate.Date == DateTime.Today.Date && request.AppointmentTime < DateTime.Now.TimeOfDay)
            {
                throw new Exception(MessageConstants.MSG.MSG34); // "Ngày hẹn tái khám phải sau ngày hôm nay"
            }
            if (await _dentistRepository.GetDentistByDentistIdAsync(request.DentistId) == null)
            {
                throw new Exception("Bác sĩ không tồn tại");
            }
            if(await _patientRepository.GetPatientByPatientIdAsync(request.PatientId) == null)
            {
                throw new Exception("Bệnh nhân không tồn tại"); // "Bệnh nhân không tồn tại"
            }
            var checkValidAppointment = await _appointmentRepository.GetLatestAppointmentByPatientIdAsync(request.PatientId);
            if(checkValidAppointment.Status == "confirmed")
            {
                throw new Exception(MessageConstants.MSG.MSG89); // "Kế hoạch điều trị đã tồn tại"
            }

            var appointment = new Appointment
            {
                PatientId = request.PatientId,
                DentistId = request.DentistId,
                Status = "confirmed",
                Content = request.ReasonForFollowUp,
                IsNewPatient = false,
                AppointmentType = "follow-up",
                AppointmentDate = request.AppointmentDate,
                AppointmentTime = request.AppointmentTime,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDeleted = false
            };

            var isbookappointment = await _appointmentRepository.CreateAppointmentAsync(appointment);

            // Send notification to patient and dentist
            try
            {
                var dentist = await _dentistRepository.GetDentistByDentistIdAsync(request.DentistId);
                var patient = await _patientRepository.GetPatientByPatientIdAsync(request.PatientId);

                await _mediator.Send(new SendNotificationCommand(
                      patient.User.UserID,
                      "Đặt lịch hẹn tái khám",
                      $"Lễ tân đã đặt lịch hẹn tái khám cho bạn với bác sĩ {dentist.User.Fullname} vào lúc {appointment.AppointmentDate} {appointment.AppointmentTime}",
                      "appointment",
                      null, ""),cancellationToken);
                await _mediator.Send(new SendNotificationCommand(
                      dentist.User.UserID,
                      "Đặt lịch hẹn tái khám",
                      $"Lễ tân đã đặt lịch hẹn tái khám cho bệnh nhân {patient.User.Fullname} với bạn vào lúc {appointment.AppointmentDate} {appointment.AppointmentTime}",
                      "appointment"
                        , null, ""), cancellationToken);
            }
            catch
            {
            }

            return isbookappointment ? MessageConstants.MSG.MSG05 : MessageConstants.MSG.MSG58;
        }
    }
}
