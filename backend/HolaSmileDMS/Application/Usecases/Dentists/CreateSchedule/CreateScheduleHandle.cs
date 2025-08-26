using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.ManageSchedule
{
    public class CreateScheduleHandle : IRequestHandler<CreateScheduleCommand, string>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IDentistRepository _dentistRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;

        public CreateScheduleHandle(IHttpContextAccessor httpContextAccessor, IScheduleRepository scheduleRepository , IDentistRepository dentistRepository,IOwnerRepository ownerRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _dentistRepository = dentistRepository;
            _ownerRepository = ownerRepository;
            _scheduleRepository = scheduleRepository;
            _mediator = mediator;
        }

        public async Task<string> Handle(CreateScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

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
                        await _scheduleRepository.DeleteSchedule(isDuplicate.ScheduleId,currentUserId);
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

            // Send notification to owner
            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();
                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(new SendNotificationCommand(
                      o.User.UserID,
                      "Đăng ký lịch làm việc",
                      $"Nha Sĩ {dentistExist.User.Fullname} đã đăng ký lịch làm việc vào lúc {DateTime.Now}",
                      "schedule", 0, $"schedules"),
                cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);  
            }
            catch { }

            return MessageConstants.MSG.MSG52; // "Tạo lịch làm việc thành công"
        }
    }
}
