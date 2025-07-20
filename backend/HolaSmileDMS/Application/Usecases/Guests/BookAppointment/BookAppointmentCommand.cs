using MediatR;

namespace HDMS_API.Application.Usecases.Guests.BookAppointment
{
    public class BookAppointmentCommand : IRequest<string>
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime AppointmentDate { get; set; }
        public TimeSpan AppointmentTime { get; set; }
        public string MedicalIssue { get; set; }
        public int DentistId { get; set; }
        public string CaptchaValue { get; set; }
        public string CaptchaInput { get; set; }

    }
}
