using Application.Usecases.Dentist.ViewAllDentistSchedule;
using MediatR;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewDetailScheduleCommand : IRequest<ScheduleDTO>
    {
        public int ScheduleId { get; set; }
        public ViewDetailScheduleCommand(int scheduleId)
        {
            ScheduleId = scheduleId;
        }
    }
}
