using MediatR;

namespace Application.Usecases.Owner.ApproveDentistSchedule
{
    public class ApproveDentistScheduleCommand : IRequest<string>
    {
        public List<int> ScheduleIds { get; set; } = new();
        public string Action { get; set; } = "approve";
    }
}
