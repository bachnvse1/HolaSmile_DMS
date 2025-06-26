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
            var schedules = await _scheduleRepository.GetAllDentistSchedulesAsync();
            if(schedules == null)
            {
                throw new Exception(MessageConstants.MSG.MSG16);
            }

            var result = schedules.GroupBy(s => s.DentistId)
                .Select(g => new DentistScheduleDTO
                {
                    DentistID = g.First().DentistId,
                    DentistName = g.First().Dentist.User.Fullname,
                    Avatar = g.First().Dentist.User.Avatar,
                    schedules = g.Select(s => new ScheduleDTO
                    {
                        ScheduleId = s.ScheduleId,
                        WorkDate = s.WorkDate.Date,
                        DentistName = s.Dentist.User.Fullname,
                        Shift = s.Shift,
                        CreatedAt = s.CreatedAt.Date,
                        UpdatedAt = s.UpdatedAt?.Date
                    }).ToList(),
                    IsAvailable = g.First().Dentist.Appointments.Count < 5 // Assuming 5 is the max appointments allowed
                }).ToList();
            return result;
        }
    }
}
