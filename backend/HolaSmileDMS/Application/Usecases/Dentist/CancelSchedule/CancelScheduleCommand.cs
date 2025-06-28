using MediatR;

namespace Application.Usecases.Dentist.CancelSchedule
{
    public class CancelScheduleCommand : IRequest<bool>
    {
        public int ScheduleId { get; set; }
    }
}
