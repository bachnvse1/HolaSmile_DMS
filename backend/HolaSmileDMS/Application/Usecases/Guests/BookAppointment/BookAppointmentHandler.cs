using AutoMapper;
using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using MediatR;
using Microsoft.IdentityModel.Tokens;
using Application.Constants;
using Application.Interfaces;

namespace HDMS_API.Application.Usecases.Guests.BookAppointment
{
    public class BookAppointmentHandler : IRequestHandler<BookAppointmentCommand, string>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IMapper _mapper;
        public BookAppointmentHandler(IAppointmentRepository appointmentRepository, IPatientRepository patientRepository, IUserCommonRepository userCommonRepository,IMapper mapper)
        {
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _userCommonRepository = userCommonRepository;
            _mapper = mapper;
        }
        public async Task<string> Handle(BookAppointmentCommand request, CancellationToken cancellationToken)
        {
            if (request.FullName.Trim().IsNullOrEmpty())
            {
                throw new Exception(MessageConstants.MSG.MSG07); // "Vui lòng nhập thông tin bắt buộc"
            }
            if (!FormatHelper.IsValidEmail(request.Email))
            {
                throw new Exception(MessageConstants.MSG.MSG08); // "Định dạng email không hợp lệ"
            }
            if (!FormatHelper.FormatPhoneNumber(request.PhoneNumber))
            {
                throw new Exception(MessageConstants.MSG.MSG56); // "Số điện thoại không đúng định dạng"
            }
            if (request.AppointmentDate.Date < DateTime.Now.Date)
            {
                throw new Exception(MessageConstants.MSG.MSG74);
            }
            if (request.AppointmentDate.Date == DateTime.Now.Date && request.AppointmentTime < DateTime.Now.TimeOfDay)
            {
                throw new Exception(MessageConstants.MSG.MSG74);
            }

            var patient = new Patient();
            var user = new User();
            var isNewPatient = true;

            var guest = _mapper.Map<CreatePatientDto>(request);
            var existUser = await _userCommonRepository.GetUserByPhoneAsync(guest.PhoneNumber);
            // Check if the patient already exists in the system
            if (existUser != null)
            {
                isNewPatient = false; // The patient already exists, so we will not create a new account
                user = existUser; // Use the existing user
                // If the user exists, check if they have a patient record
                patient = await _patientRepository.GetPatientByUserIdAsync(existUser.UserID)
                      ?? throw new Exception(MessageConstants.MSG.MSG27); // "Không tìm thấy hồ sơ bệnh nhân"

                // Check if the latsest appointment for the patient is confirmed
                var checkValidAppointment = await _appointmentRepository.GetLatestAppointmentByPatientIdAsync(patient.PatientID);
                if (checkValidAppointment != null && checkValidAppointment.Status == "confirmed")
                {
                    throw new Exception(MessageConstants.MSG.MSG89); // "Kế hoạch điều trị đã tồn tại"
                }
                //checck duplicate appointment
                bool already = await _appointmentRepository.ExistsAppointmentAsync(patient.PatientID, request.AppointmentDate);
                if (already) throw new Exception(MessageConstants.MSG.MSG74);
            }
            else // If the patient does not exist, create a new account and patient record
            {
                 user = await _userCommonRepository.CreatePatientAccountAsync(guest, "123456");
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

                 patient = await _patientRepository.CreatePatientAsync(guest, user.UserID);
                if (patient == null)
                {
                    throw new Exception(MessageConstants.MSG.MSG77);
                }
            }

            var appointment = new Appointment
            {
                PatientId = patient.PatientID,
                DentistId = request.DentistId,
                Status = "confirmed",
                Content = request.MedicalIssue,
                IsNewPatient = isNewPatient,
                AppointmentType = "",
                AppointmentDate = request.AppointmentDate,
                AppointmentTime = request.AppointmentTime,
                CreatedAt = DateTime.Now,
                CreatedBy = user.UserID,
                IsDeleted = false
            };
            var isbookappointment = await _appointmentRepository.CreateAppointmentAsync(appointment);
            return isbookappointment ? MessageConstants.MSG.MSG05 : MessageConstants.MSG.MSG58;
        }
    }
}
