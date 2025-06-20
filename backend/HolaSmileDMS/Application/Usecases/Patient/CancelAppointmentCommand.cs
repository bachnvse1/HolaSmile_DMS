
using MediatR;

namespace Application.Usecases.Patient
{
    public class CancelAppointmentCommand : IRequest<string>
    {
        public int AppointmentId { get; set; }
    }
}
