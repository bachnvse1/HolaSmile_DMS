using MediatR;

namespace Application.Usecases.Patients.CancelAppointment
{
    public class CancelAppointmentCommand : IRequest<string>
    {
        public int AppointmentId { get; set; }
        public CancelAppointmentCommand(int appointmentId)
        {
            AppointmentId = appointmentId;
        }
    }
}
