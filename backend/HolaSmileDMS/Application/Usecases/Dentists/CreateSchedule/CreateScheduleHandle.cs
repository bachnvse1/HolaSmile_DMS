using System.Security.Claims;
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

            // Check if the user is authenticated
            if (currentUserId == 0 || string.IsNullOrEmpty(currentUserRole))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập để thực hiện chức năng này"
            }

            // Check if the user is not a dentist return failed message
            if (!string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            // Check if the dentist exists
            var dentistExist = await _dentistRepository.GetDentistByUserIdAsync(currentUserId);

            //create list regis schedule
            foreach (var item in request.RegisSchedules)
            {
                if (item.WorkDate < DateTime.Now)
                {
                    throw new Exception(MessageConstants.MSG.MSG34); // "Ngày bắt đầu không được sau ngày kết thúc"
                }
                if (string.IsNullOrEmpty(item.Shift.Trim()))
                {
                    throw new Exception(MessageConstants.MSG.MSG07); // "Vui lòng nhập thông tin bắt buộc"
                }
                var weekstart = _scheduleRepository.GetWeekStart(item.WorkDate);
                var schedule = new Schedule
                {
                    DentistId = dentistExist.DentistId,
                    WorkDate = item.WorkDate,
                    Shift = item.Shift,
                    Status = "pending",
                    WeekStartDate = weekstart,
                    CreatedBy = currentUserId,
                    CreatedAt = DateTime.Now,
                    IsActive = true,
                };
                var isDuplicate = await _scheduleRepository.CheckDulplicateScheduleAsync(schedule.DentistId, schedule.WorkDate, schedule.Shift, schedule.ScheduleId);
                if (isDuplicate != null)
                {
                    if (isDuplicate.Status == "rejected")
                    {
                        // xóa mềm lịch bị từ chối cũ
                        await _scheduleRepository.DeleteSchedule(isDuplicate.ScheduleId);
                    }
                    else
                    {
                        throw new Exception(MessageConstants.MSG.MSG89); // lịch trùng và đang pending/approved
                    }
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
