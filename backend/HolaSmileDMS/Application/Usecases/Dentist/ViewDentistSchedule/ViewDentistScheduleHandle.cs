using System.Security.Claims;
using Application.Constants;
using Application.Constants.Interfaces;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewDentistScheduleHandle : IRequestHandler<ViewDentistScheduleCommand, List<DentistScheduleDTO>>
    {
        private readonly IDentistRepository _dentistRepository;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ViewDentistScheduleHandle(IDentistRepository dentistRepository, IScheduleRepository scheduleRepository, IHttpContextAccessor httpContextAccessor)
        {
            _dentistRepository = dentistRepository;
            _httpContextAccessor = httpContextAccessor;
            _scheduleRepository = scheduleRepository;
        }
        public async Task<List<DentistScheduleDTO>> Handle(ViewDentistScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Nếu người dùng là dentist -> chỉ cho xem lịch của chính mình
            if (string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                var currentDentist = await _dentistRepository.GetDentistByUserIdAsync(currentUserId);
                if (currentDentist == null || currentDentist.DentistId != request.DentistId)
                {
                    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
                }
            }
            else if (!string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase)
                  && !string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            var schedules = await _scheduleRepository.GetDentistSchedulesByDentistIdAsync(request.DentistId);

            if (schedules == null || !schedules.Any())
            {
                throw new Exception(MessageConstants.MSG.MSG16);
            }

            var result = schedules.GroupBy(s => s.DentistId)
                .Select(g => new DentistScheduleDTO
                {
                    DentistID = g.Key,
                    DentistName = g.First().Dentist.User.Fullname,
                    Avatar = g.First().Dentist.User.Avatar,
                    Schedules = g.Select(s => new ScheduleDTO
                    {
                        ScheduleId = s.ScheduleId,
                        WorkDate = s.WorkDate.Date,
                        Shift = s.Shift,
                        Status = s.Status,
                        CreatedAt = s.CreatedAt.Date,
                        UpdatedAt = s.UpdatedAt?.Date
                    }).ToList(),
                }).ToList();

            return result;
        }
    }
}
