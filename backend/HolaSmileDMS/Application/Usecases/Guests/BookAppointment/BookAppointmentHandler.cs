using AutoMapper;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using MediatR;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;

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
        public BookAppointmentHandler(IAppointmentRepository appointmentRepository, IMediator mediator, IPatientRepository patientRepository, IUserCommonRepository userCommonRepository,IMapper mapper)
        {
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _userCommonRepository = userCommonRepository;
            _mapper = mapper;
            _mediator = mediator;
        }
        public async Task<string> Handle(BookAppointmentCommand request, CancellationToken cancellationToken)
        {

            if (request.AppointmentDate.Date < DateTime.Now.Date)
            {
                throw new Exception(MessageConstants.MSG.MSG74);
            }
            if (request.AppointmentDate.Date == DateTime.Now.Date && request.AppointmentTime < DateTime.Now.TimeOfDay)
            {
                throw new Exception(MessageConstants.MSG.MSG74);
            }

            var guest = _mapper.Map<CreatePatientDto>(request);
            var existUser = await _userCommonRepository.GetUserByPhoneAsync(guest.PhoneNumber);

            var user = await _userCommonRepository.CreatePatientAccountAsync(guest, "123456");
                if (user == null)
                {
                    throw new Exception(MessageConstants.MSG.MSG76);
                }

                // Send password to guest email asynchronously
                _ = System.Threading.Tasks.Task.Run(async () =>
                {
                    try
                    {
                        await _userCommonRepository.SendPasswordForGuestAsync(user.Email);
                    }
                    catch (Exception ex)
                    {
                        throw new Exception(MessageConstants.MSG.MSG78); // => Gợi ý định nghĩa: "Gửi mật khẩu cho khách không thành công."
                    }
                });

             var patient = await _patientRepository.CreatePatientAsync(guest, user.UserID);
                if (patient == null)
                {
                    throw new Exception(MessageConstants.MSG.MSG77);
                }
            var appointment = new Appointment
            {
                PatientId = patient.PatientID,
                DentistId = request.DentistId,
                Status = "confirmed",
                Content = request.MedicalIssue,
                IsNewPatient = true,
                AppointmentType = "first-time",
                AppointmentDate = request.AppointmentDate,
                AppointmentTime = request.AppointmentTime,
                CreatedAt = DateTime.Now,
                CreatedBy = user.UserID,
                IsDeleted = false
            };
            var isbookappointment = await _appointmentRepository.CreateAppointmentAsync(appointment);
            var dentist = _dentistRepository.GetDentistByDentistIdAsync(request.DentistId);
            var receptionists = await _userCommonRepository.GetAllReceptionistAsync();

            await _mediator.Send(new SendNotificationCommand(
                patient.User.UserID,
                    "Đăng ký khám",
                    $"Bạn đã đăng ký khám vào ngày {request.AppointmentDate.Date}.",
                    "Tạo lịch khám lần đầu", null),
                cancellationToken);

            await _mediator.Send(new SendNotificationCommand(
                dentist.Result.UserId,
                    "Xóa hồ sơ điều trị",
                    $"Bệnh nhân đã đăng ký khám vào ngày {request.AppointmentDate.Date}",
                    "Xoá hồ sơ",
                    null),
                cancellationToken);

            var notifyReceptionists = receptionists.Select(r =>
             _mediator.Send(new SendNotificationCommand(
                           r.UserId,
                           "Đăng ký khám",
                            $"Bệnh nhân mới đã đăng ký khám vào ngày {request.AppointmentDate.Date}.",
                            "Tạo lịch khám lần đầu", null),
                            cancellationToken));
            await System.Threading.Tasks.Task.WhenAll(notifyReceptionists);

            return isbookappointment ? MessageConstants.MSG.MSG05 : MessageConstants.MSG.MSG58;
        }
    }
}
