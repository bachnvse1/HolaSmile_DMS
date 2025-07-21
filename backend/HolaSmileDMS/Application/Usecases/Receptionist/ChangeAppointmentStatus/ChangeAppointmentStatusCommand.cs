
using MediatR;

namespace Application.Usecases.Receptionist.ChangeAppointmentStatus
{
    public class ChangeAppointmentStatusCommand : IRequest<bool>
    {
        public int AppointmentId { get; set; }
        public string Status { get; set; } // "confirmed", "cancelled", "completed", etc.
        public ChangeAppointmentStatusCommand(int appointmentId, string status)
        {
            AppointmentId = appointmentId;
            Status = status;
        }
    }
}
