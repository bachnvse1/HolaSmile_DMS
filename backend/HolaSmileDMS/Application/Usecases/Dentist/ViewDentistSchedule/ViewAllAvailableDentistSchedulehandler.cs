using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using MediatR;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewAllAvailableDentistSchedulehandler : IRequestHandler<ViewAllAvailableDentistScheduleCommand, List<DentistScheduleDTO>>
    {
        private readonly IScheduleRepository _scheduleRepository;
        public ViewAllAvailableDentistSchedulehandler(IScheduleRepository scheduleRepository)
        {
            _scheduleRepository = scheduleRepository;
        }
        public async Task<List<DentistScheduleDTO>> Handle(ViewAllAvailableDentistScheduleCommand request, CancellationToken cancellationToken)
        {
            var schedules = await _scheduleRepository.GetAllAvailableDentistSchedulesAsync(3);
            if (schedules == null || schedules.Count == 0)
            {
                throw new Exception(MessageConstants.MSG.MSG16);
            }

            var result = schedules
                         .GroupBy(s => s.DentistId)
                         .Select(g => new DentistScheduleDTO
                         {
                             DentistID = g.Key,
                             DentistName = g.First().Dentist.User.Fullname,
                             Avatar = g.First().Dentist.User.Avatar,
                             Schedules = g.Select(s => new ScheduleDTO
                             {
                                 ScheduleId = s.ScheduleId,
                                 WorkDate = s.WorkDate,
                                 DentistName = s.Dentist.User.Fullname,
                                 Shift = s.Shift,
                                 CreatedAt = s.CreatedAt,
                                 UpdatedAt = s.UpdatedAt
                             }).ToList()
                         }).ToList();
            return result;
        }
    }
}
