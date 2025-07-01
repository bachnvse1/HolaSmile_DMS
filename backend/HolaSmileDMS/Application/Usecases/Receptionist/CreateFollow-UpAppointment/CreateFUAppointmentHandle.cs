using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.CreateFollow_UpAppointment
{
    public class CreateFUAppointmentHandle : IRequestHandler<CreateFUAppointmentCommand, string>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IDentistRepository _dentistRepository;

        public CreateFUAppointmentHandle(IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor, IPatientRepository patientRepository, IDentistRepository dentistRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _dentistRepository = dentistRepository;
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
            if (request.AppointmentDate < DateTime.Today)
            {
                throw new Exception(MessageConstants.MSG.MSG34); // "Ngày hẹn tái khám phải sau ngày hôm nay"
            }
            if (request.AppointmentDate.Date == DateTime.Today.Date && request.AppointmentTime < DateTime.Today.TimeOfDay)
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
            return isbookappointment ? MessageConstants.MSG.MSG05 : MessageConstants.MSG.MSG58;
        }
    }
}
