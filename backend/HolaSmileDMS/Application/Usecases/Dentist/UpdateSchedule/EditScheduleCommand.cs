using MediatR;

namespace Application.Usecases.Dentist.UpdateSchedule
{
    public class EditScheduleCommand : IRequest<string>
    {
        public int ScheduleId { get; set; }
        public DateTime WorkDate { get; set; }
        public string Shift { get; set; }
    }
}
