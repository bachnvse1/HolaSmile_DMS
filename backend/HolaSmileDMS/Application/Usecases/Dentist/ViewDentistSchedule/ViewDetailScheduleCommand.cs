using Application.Usecases.Dentist.ViewAllDentistSchedule;
using MediatR;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewDetailScheduleCommand : IRequest<ScheduleDTO>
    {
        public string ScheduleId { get; set; }
    }
}
