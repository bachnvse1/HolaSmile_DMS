using MediatR;

namespace Application.Usecases.UserCommon.ViewAppointment
{
    public class ViewDetailAppointmentCommand : IRequest<AppointmentDTO>
    {
        public int AppointmentId { get; set; }
        public ViewDetailAppointmentCommand(int appointmentId)
        {
            AppointmentId = appointmentId;
        }
    }
}
