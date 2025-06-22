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

            // Check if the user is not a dentist return failed message
            if (!string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                return MessageConstants.MSG.MSG26;
            }

            // Check if the dentist exists
            var dentistExist = await _dentistRepository.GetDentistByUserIdAsync(currentUserId);

            //create list regis schedule
            foreach (var item in request.RegisSchedules)
            {
                if (item.WorkDate < DateTime.Now)
                {
                    return MessageConstants.MSG.MSG34; // "Ngày bắt đầu không được sau ngày kết thúc"
                }
                if (string.IsNullOrEmpty(item.Shift))
                {
                    return MessageConstants.MSG.MSG07; // "Vui lòng nhập thông tin bắt buộc"
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
                    CreatedAt = DateTime.Now,
                    IsActive = true,
                };
                var isDuplicate = await _scheduleRepository.CheckDulplicateScheduleAsync(schedule.DentistId, schedule.WorkDate, schedule.Shift, schedule.ScheduleId);
                if (isDuplicate)
                {
                    throw new Exception(MessageConstants.MSG.MSG51); // trùng lịch làm việc hiện tại
                }
                var isRegistered = await _scheduleRepository.RegisterScheduleByDentist(schedule);
                if (!isRegistered)
                {
                    return MessageConstants.MSG.MSG73; // "Cập nhật dữ liệu thất bại"
                }
            }
            return MessageConstants.MSG.MSG52; // "Tạo lịch làm việc thành công"
        }
    }
}
