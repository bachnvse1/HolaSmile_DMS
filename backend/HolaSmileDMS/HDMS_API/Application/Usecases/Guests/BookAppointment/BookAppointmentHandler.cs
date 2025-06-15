using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Repositories;
using MediatR;

namespace HDMS_API.Application.Usecases.Guests.BookAppointment
{
    public class BookAppointmentHandler : IRequestHandler<BookAppointmentCommand, string>
    {
        private readonly IGuestRepository _guestRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        public BookAppointmentHandler(IGuestRepository guestRepository, IAppointmentRepository appointmentRepository, IPatientRepository patientRepository,IUserCommonRepository userCommonRepository)
        {
            _guestRepository = guestRepository;
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _userCommonRepository = userCommonRepository;
        }
        public async Task<string> Handle(BookAppointmentCommand request, CancellationToken cancellationToken)
        {
            var checkBookAppointment = await _guestRepository.BookAppointmentAsync(request);
            if(!checkBookAppointment.Equals(""))
            {
                return checkBookAppointment;
            }
            //var user = await _userCommonRepository.CreatePatientAccountAsync(request, "123456");
            //if (user == null)
            //{
            //    throw new Exception("Tạo tài khoản thất bại.");
            //}
            //if (!await _userCommonRepository.SendPasswordForGuestAsync(user.Email))
            //{
            //    throw new Exception("Gửi mật khẩu thất bại.");
            //}
            //var patient = await _patientRepository.CreatePatientAsync(request, user.UserID);


            //return Task.FromResult("Appointment booked successfully");
            return "a";
        }
    }

}
