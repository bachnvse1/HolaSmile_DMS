using AutoMapper;
using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using MediatR;
using Microsoft.IdentityModel.Tokens;

namespace HDMS_API.Application.Usecases.Guests.BookAppointment
{
    public class BookAppointmentHandler : IRequestHandler<BookAppointmentCommand, string>
    {
        private readonly IGuestRepository _guestRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IMapper _mapper;
        public BookAppointmentHandler(IGuestRepository guestRepository, IAppointmentRepository appointmentRepository, IPatientRepository patientRepository,IUserCommonRepository userCommonRepository,IMapper mapper)
        {
            _guestRepository = guestRepository;
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _userCommonRepository = userCommonRepository;
            _mapper = mapper;
        }
        public async Task<string> Handle(BookAppointmentCommand request, CancellationToken cancellationToken)
        {
            if (request.FullName.Trim().IsNullOrEmpty())
            {
                throw new Exception("Họ tên không thể để trống.");
            }
            if (!FormatHelper.IsValidEmail(request.Email))
            {
                throw new Exception("Email không hợp lệ.");
            }
            if (!FormatHelper.FormatPhoneNumber(request.PhoneNumber))
            {
                throw new Exception("Số điện thoại không hợp lệ.");
            }
            if (request.AppointmentDate.Date < DateTime.Now.Date)
            {
                throw new Exception("Ngày hẹn không thể là ngày trong quá khứ.");
            }
            var guest = _mapper.Map<CreatePatientDto>(request);
            var existPatient = await _userCommonRepository.GetUserByPhoneAsync(guest.PhoneNumber);
            // Check if the patient already exists in the system
            if (existPatient != null)
            {
                var app0 = await _guestRepository.CreateAppointmentAsync(request, existPatient.UserID);
                return "Tạo cuộc hẹn thành công.";

            }
            else // If the patient does not exist, create a new account and patient record
            {
                var user = await _userCommonRepository.CreatePatientAccountAsync(guest, "123456");
                if (user == null)
                {
                    throw new Exception("Tạo tài khoản thất bại.");
                }
                if (!await _userCommonRepository.SendPasswordForGuestAsync(user.Email))
                {
                    throw new Exception("Gửi mật khẩu thất bại.");
                }
                var patient = await _patientRepository.CreatePatientAsync(guest, user.UserID);
                if (patient == null)
                {
                    throw new Exception("Tạo bệnh nhân thất bại.");
                }
                var app = await _guestRepository.CreateAppointmentAsync(request, patient.PatientID);
                if (app == null)
                {
                    throw new Exception("Tạo cuộc hẹn thất bại.");
                }
                return "Tạo cuộc hẹn thành công.";
            }
        }
    }

}
