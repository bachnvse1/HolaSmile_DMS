using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewAllDentistSchedulehandler : IRequestHandler<ViewAllDentistScheduleCommand, List<DentistScheduleDTO>>
    {
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewAllDentistSchedulehandler(IScheduleRepository scheduleRepository, IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
            _scheduleRepository = scheduleRepository;
        }
        public async Task<List<DentistScheduleDTO>> Handle(ViewAllDentistScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;

            var currentUserRole = user.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (string.IsNullOrEmpty(currentUserRole) || currentUserId <= 0)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);
            }

            var schedules = new List<Schedule>();
            if (string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                schedules = await _scheduleRepository.GetAllDentistSchedulesAsync();
            }
            else
            {
                schedules = await _scheduleRepository.GetAllAvailableDentistSchedulesAsync(3);
            }

            if(schedules == null || !schedules.Any())
            {
                schedules = new List<Schedule>();
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
                                      Status = s.Status,
                                      CreatedAt = s.CreatedAt,
                                      UpdatedAt = s.UpdatedAt
                                   }).ToList()
                                 }).ToList();
            return result;
        }
    }
}
