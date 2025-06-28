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
                return MessageConstants.MSG.MSG26; // "Bạn không có quyền truy cập chức năng này"
            }

            if (request.AppointmentDate < DateTime.Today)
            {
                return MessageConstants.MSG.MSG34; // "Ngày hẹn tái khám phải sau ngày hôm nay"
            }
            if(await _dentistRepository.GetDentistByDentistIdAsync(request.DentistId) == null)
            {
                return "Bác sĩ không tồn tại"; // "Bác sĩ không tồn tại"
            }
            if(await _patientRepository.GetPatientByIdAsync(request.PatientId) == null)
            {
                return "Bệnh nhân không tồn tại"; // "Bệnh nhân không tồn tại"
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
                Status = "pending",
                Content = request.ReasonForFollowUp,
                IsNewPatient = false,
                AppointmentType = "",
                AppointmentDate = request.AppointmentDate,
                AppointmentTime = request.AppointmentTime,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDeleted = false
            };
            bool already = await _appointmentRepository.ExistsAppointmentAsync(request.PatientId, request.AppointmentDate);
            if (already) throw new Exception(MessageConstants.MSG.MSG74);
            var isbookappointment = await _appointmentRepository.CreateAppointmentAsync(appointment);
            return isbookappointment ? MessageConstants.MSG.MSG05 : MessageConstants.MSG.MSG58;
        }
    }
}
