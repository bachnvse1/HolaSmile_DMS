using AutoMapper;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using MediatR;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using HDMS_API.Application.Interfaces;

namespace HDMS_API.Application.Usecases.Guests.BookAppointment
{
    public class BookAppointmentHandler : IRequestHandler<BookAppointmentCommand, string>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IDentistRepository _dentistRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IEmailService _emailService;
        public BookAppointmentHandler(IAppointmentRepository appointmentRepository, IMediator mediator, IPatientRepository patientRepository, IUserCommonRepository userCommonRepository, IMapper mapper, IDentistRepository dentistRepository, IHttpContextAccessor httpContextAccessor, IEmailService emailService)

        {
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _dentistRepository = dentistRepository;
            _userCommonRepository = userCommonRepository;
            _mapper = mapper;
            _mediator = mediator;
            _dentistRepository = dentistRepository;
            _httpContextAccessor = httpContextAccessor;
            _emailService = emailService;
        }
        public async Task<string> Handle(BookAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            Patient patient = new Patient();
            var appType = "first-time";
            bool isNewPatient = false;

            if (request.AppointmentDate.Date < DateTime.Now.Date || (request.AppointmentDate.Date == DateTime.Now.Date && request.AppointmentTime < DateTime.Now.TimeOfDay))
            {
                throw new Exception(MessageConstants.MSG.MSG74); // "Không thể đặt lịch hẹn ở thời gian quá khứ."
            }

            if (currentUserRole == null)
            {
               if(request.CaptchaValue != request.CaptchaInput)
                {
                    throw new Exception(MessageConstants.MSG.MSG124); // "Captcha không hợp lệ."
                }

            var guest = _mapper.Map<CreatePatientDto>(request);

                var newUser = await _userCommonRepository.CreatePatientAccountAsync(guest, "123456");
                if (newUser == null)
                {
                    throw new Exception(MessageConstants.MSG.MSG76);
                }

                // Send password to guest email asynchronously
                _ = System.Threading.Tasks.Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendPasswordAsync(newUser.Email, "123456");
                    }
                    catch (Exception ex)
                    {
                        throw new Exception(MessageConstants.MSG.MSG78);
                    }
                });

                patient = await _patientRepository.CreatePatientAsync(guest, newUser.UserID);
                if (patient == null)
                {
                    throw new Exception(MessageConstants.MSG.MSG77);
                }

                isNewPatient = true;
                currentUserId = newUser.UserID;
            }
            else if (string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                patient = await _patientRepository.GetPatientByUserIdAsync(currentUserId);
                if (patient == null)
                {
                    throw new Exception(MessageConstants.MSG.MSG27); // "Không tìm thấy hồ sơ bệnh nhân"
                }

                var checkValidAppointment = await _appointmentRepository.GetLatestAppointmentByPatientIdAsync(patient.PatientID);
                if (checkValidAppointment != null &&
                    (checkValidAppointment.Status == "confirmed" ||
                     (checkValidAppointment.AppointmentDate.Date >= DateTime.Now.Date && checkValidAppointment.Status == "confirmed")))
                {
                    throw new Exception(MessageConstants.MSG.MSG89); 
                }
                appType = "follow-up";

            }
            else
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }


            var appointment = new Appointment
            {
                PatientId = patient.PatientID,
                DentistId = request.DentistId,
                Status = "confirmed",
                Content = request.MedicalIssue,
                IsNewPatient = isNewPatient,
                AppointmentType = appType,
                AppointmentDate = request.AppointmentDate,
                AppointmentTime = request.AppointmentTime,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDeleted = false
            };
            var isBookAppointment = await _appointmentRepository.CreateAppointmentAsync(appointment);

            try
            {
                var dentist = await _dentistRepository.GetDentistByDentistIdAsync(request.DentistId);
                var receptionists = await _userCommonRepository.GetAllReceptionistAsync();
                //GỬI THÔNG BÁO CHO DENTIST
                await _mediator.Send(new SendNotificationCommand(
                    dentist.User.UserID,
                        "Đăng ký khám",
                        $"Bệnh nhân đã đăng ký khám vào ngày {request.AppointmentDate.ToString("dd/MM/yyyy")} {request.AppointmentTime}.",
                        "appointment",
                        0, $"appointments/{appointment.AppointmentId}"),
                    cancellationToken);

                var notifyReceptionists = receptionists.Select(async r =>
                 await _mediator.Send(new SendNotificationCommand(
                               r.User.UserID,
                               "Đăng ký khám",
                                $"Bệnh nhân đã đăng ký khám vào ngày {request.AppointmentDate.ToString("dd/MM/yyyy")} {request.AppointmentTime}.",
                                "appointment", 0, $"appointments/{appointment.AppointmentId}"),
                                cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyReceptionists);
            }
            catch { }

            return isBookAppointment ? MessageConstants.MSG.MSG05 : MessageConstants.MSG.MSG58;
        }
    }
}
