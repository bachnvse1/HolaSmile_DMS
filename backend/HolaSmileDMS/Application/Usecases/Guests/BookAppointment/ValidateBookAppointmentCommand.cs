using MediatR;

namespace Application.Usecases.Guests.BookAppointment
{
    public class ValidateBookAppointmentCommand : IRequest<ValidateBookAppointmentCommand>
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string MedicalIssue { get; set; }
    }
}
