using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.ManageSchedule
{
    public class CreateScheduleHandle : IRequestHandler<CreateScheduleCommand, string>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IDentistRepository _dentistRepository;
        public CreateScheduleHandle(IHttpContextAccessor httpContextAccessor, IScheduleRepository scheduleRepository , IDentistRepository dentistRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _dentistRepository = dentistRepository;
            _scheduleRepository = scheduleRepository;
        }

        public async Task<string> Handle(CreateScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                return MessageConstants.MSG.MSG26;
            }

            var dentistExist = await _dentistRepository.GetDentistByUserIdAsync(currentUserId);

            foreach (var item in request.RegisSchedules)
            {
                if (item.WorkDate < DateTime.Now)
                {
                    return "ngày làm việc không thể trước hôm nay.";
                }
                if (string.IsNullOrEmpty(item.Shift))
                {
                    return "ca làm việc không thể trống";
                }
                var weekstart = _scheduleRepository.GetWeekStart(item.WorkDate);
                var schedule = new Schedule
                {
                    DentistId = dentistExist.DentistId,
                    WorkDate = item.WorkDate,
                    Shift = item.Shift,
                    Status = "pending",
                    WeekStartDate = weekstart,
                    CreatedBy = dentistExist.DentistId,
                    CreatedAt = DateTime.Now
                };
                var isRegistered = await _scheduleRepository.RegisterScheduleByDentist(schedule);
                if (!isRegistered)
                {
                    return "Đăng ký lịch làm việc không thành công.";
                }
            }
            return "Đăng ký lịch làm việc thành công.";
        }
    }
}
