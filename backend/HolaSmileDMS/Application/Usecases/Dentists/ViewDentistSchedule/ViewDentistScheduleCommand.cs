using MediatR;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewDentistScheduleCommand : IRequest<List<DentistScheduleDTO>>
    {
        public int DentistId { get; set; }
    }
}
