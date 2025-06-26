using MediatR;

namespace Application.Usecases.Dentist.CancelSchedule
{
    public class CancelScheduleCommand : IRequest<string>
    {
        public int ScheduleId { get; set; }
    }
}
