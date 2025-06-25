using System.Security.Claims;
using Application.Constants;
using Application.Constants.Interfaces;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Owner
{
    public class AppointmentScheduleHandle : IRequestHandler<ApproveDentistScheduleCommand, string>
    {
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AppointmentScheduleHandle(IScheduleRepository scheduleRepository, IHttpContextAccessor httpContextAccessor)
        {
            _scheduleRepository = scheduleRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(ApproveDentistScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(role, "owner", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền

            int currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            foreach (var id in request.ScheduleIds)
            {
                var schedule = await _scheduleRepository.GetScheduleByIdAsync(id);

                if (schedule == null || schedule.Status != "pending")
                {
                    throw new Exception("Chỉ có thể cập nhật lịch đang ở trạng thái pending");
                }
                schedule.Status = request.Action == "approve" ? "approved" : "rejected";
                schedule.UpdatedAt = DateTime.UtcNow;
                schedule.UpdatedBy = currentUserId;

                var updated = await _scheduleRepository.UpdateScheduleAsync(schedule);
                if (!updated)
                    throw new Exception("Cập nhật lịch làm việc không thành công");
            }
            return request.Action == "approve"
                                     ? MessageConstants.MSG.MSG80 // approve thành công
                                     : MessageConstants.MSG.MSG81; // reject thành công
        }
    }
}
