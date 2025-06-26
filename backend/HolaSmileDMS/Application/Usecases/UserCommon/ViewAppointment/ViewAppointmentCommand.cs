using MediatR;

namespace Application.Usecases.UserCommon.ViewAppointment
{
    public class ViewAppointmentCommand : IRequest<List<AppointmentDTO>>
    {
    }
}
