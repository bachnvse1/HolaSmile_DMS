using MediatR;

namespace Application.Usecases.Patients.CancelAppointment
{
    public class CancelAppointmentCommand : IRequest<string>
    {
        public int AppointmentId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public CancelAppointmentCommand(int appointmentId)
        {
            AppointmentId = appointmentId;
        }
    }
}
