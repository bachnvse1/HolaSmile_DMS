using MediatR;

namespace Application.Usecases.Receptionist.EditAppointment
{
    public class EditAppointmentCommand :IRequest<bool>
    {
        public int appointmentId { get; set; }
        public int DentistId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public TimeSpan AppointmentTime { get; set; }
        public string? ReasonForFollowUp { get; set; }
    }
}
