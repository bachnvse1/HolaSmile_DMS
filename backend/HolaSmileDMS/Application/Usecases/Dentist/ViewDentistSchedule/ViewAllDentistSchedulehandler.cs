using Application.Constants;
using Application.Constants.Interfaces;
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
            var schedules = await _scheduleRepository.GetAllAvailableDentistSchedulesAsync(3);
            if(schedules == null || schedules.Count == 0)
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
                WorkDate = s.WorkDate.Date,
                DentistName = s.Dentist.User.Fullname,
                Shift = s.Shift,
                CreatedAt = s.CreatedAt.Date,
                UpdatedAt = s.UpdatedAt?.Date
            }).ToList()
        })
        .ToList();
            return result;
        }
    }
}
