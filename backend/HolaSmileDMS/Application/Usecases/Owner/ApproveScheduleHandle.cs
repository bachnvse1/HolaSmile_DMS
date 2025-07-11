using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Owner
{
    public class ApproveScheduleHandle : IRequestHandler<ApproveDentistScheduleCommand, string>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IDentistRepository _dentistRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;

        public ApproveScheduleHandle(IHttpContextAccessor httpContextAccessor, IScheduleRepository scheduleRepository, IDentistRepository dentistRepository, IOwnerRepository ownerRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _dentistRepository = dentistRepository;
            _scheduleRepository = scheduleRepository;
            _mediator = mediator;
        }

        public async Task<string> Handle(ApproveDentistScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(role, "owner", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền

            int currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var schedules = await _scheduleRepository.GetAllDentistSchedulesAsync();

            foreach (var id in request.ScheduleIds)
            {
                var schedule = await _scheduleRepository.GetScheduleByIdAsync(id);

                if (schedule == null || schedule.Status != "pending")
                {
                    throw new Exception("Chỉ có thể cập nhật lịch đang ở trạng thái pending");
                }
                schedule.Status = request.Action == "approved" ? "approved" : "rejected";
                schedule.UpdatedAt = DateTime.Now;
                schedule.UpdatedBy = currentUserId;

                var updated = await _scheduleRepository.UpdateScheduleAsync(schedule);
                if (!updated)
                    throw new Exception(MessageConstants.MSG.MSG58);
            }

            var owner = await _ownerRepository.GetOwnerByUserIdAsync(currentUserId);
            if (request.Action == "approved")
            {
                // Gửi thông báo cho các nha sĩ đã được phê duyệt lịch
                foreach (var schedule in schedules.Where(s => request.ScheduleIds.Contains(s.ScheduleId) && s.Status == "approved"))
                {
                    await _mediator.Send(new SendNotificationCommand(
                          schedule.Dentist.User.UserID,
                          "Đăng ký lịch làm việc",
                          $"Bạn đã được duyệt lich làm việc vào ngày {schedule.WorkDate.Date} lúc {DateTime.Now}",
                          "Đăng ký lịch làm việc",
                          null), cancellationToken);
                }
            }
            else
            {
                // Gửi thông báo cho các nha sĩ đã bị từ chối lịch
                foreach (var schedule in schedules.Where(s => request.ScheduleIds.Contains(s.ScheduleId) && s.Status == "rejected"))
                {
                    await _mediator.Send(new SendNotificationCommand(
                          schedule.Dentist.User.UserID,
                          "Đăng ký lịch làm việc",
                          $"Bạn đã bị từ chối lich làm việc vào ngày {schedule.WorkDate.Date} lúc {DateTime.Now}",
                          "Đăng ký lịch làm việc",
                          null), cancellationToken);
                }
            }
                return request.Action == "approved"
                                         ? MessageConstants.MSG.MSG80 // approve thành công
                                         : MessageConstants.MSG.MSG81; // reject thành công
        }
    }
}
