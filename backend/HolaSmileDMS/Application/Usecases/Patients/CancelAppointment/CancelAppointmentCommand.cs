using MediatR;

namespace Application.Usecases.Patients.CancelAppointment
{
    public class CancleAppointmentCommand : IRequest<string>
    {
        public int AppointmentId { get; set; }
        public CancleAppointmentCommand(int appointmentId)
        {
            AppointmentId = appointmentId;
        }
    }
}
