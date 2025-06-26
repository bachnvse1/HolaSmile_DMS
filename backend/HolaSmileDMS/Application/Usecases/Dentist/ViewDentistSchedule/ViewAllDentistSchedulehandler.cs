using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using MediatR;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewAllDentistSchedulehandler : IRequestHandler<ViewAllDentistScheduleCommand, List<DentistScheduleDTO>>
    {
        private readonly IScheduleRepository _scheduleRepository;
        public ViewAllDentistSchedulehandler(IScheduleRepository scheduleRepository)
        {
            _scheduleRepository = scheduleRepository;
        }
        public async Task<List<DentistScheduleDTO>> Handle(ViewAllDentistScheduleCommand request, CancellationToken cancellationToken)
        {
            return null;
        }
    }
}
