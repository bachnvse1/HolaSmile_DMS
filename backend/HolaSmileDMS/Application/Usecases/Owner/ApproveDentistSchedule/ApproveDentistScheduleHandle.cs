﻿using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Owner.ApproveDentistSchedule;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Owner.AprroveDentistSchedule
{
    public class ApproveDentistScheduleHandle : IRequestHandler<ApproveDentistScheduleCommand, string>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IMediator _mediator;

        public ApproveDentistScheduleHandle(IHttpContextAccessor httpContextAccessor, IScheduleRepository scheduleRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
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

            var notifications = new Dictionary<int, List<Schedule>>();

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

                // Gom lịch theo DentistId
                if (!notifications.ContainsKey(schedule.Dentist.User.UserID))
                    notifications[schedule.Dentist.User.UserID] = new List<Schedule>();
                notifications[schedule.Dentist.User.UserID].Add(schedule);
            }

            foreach (var kv in notifications)
            {
                var dentistId = kv.Key;
                var schedules = kv.Value;

                var actionText = request.Action == "approved" ? "được duyệt" : "bị từ chối";
                var scheduleDates = string.Join(", ", schedules.Select(s => s.WorkDate.ToString("dd/MM/yyyy")));

                try
                {
                    await _mediator.Send(new SendNotificationCommand(
                        dentistId,
                        "Đăng ký lịch làm việc",
                        $"Bạn đã {actionText} lịch làm việc vào các ngày: {scheduleDates}",
                        "Đăng ký lịch làm việc",
                        null, ""), cancellationToken);
                }
                catch { }
            }

            return request.Action == "approved"
                                     ? MessageConstants.MSG.MSG80 // approve thành công
                                     : MessageConstants.MSG.MSG81; // reject thành công
        }
    }
}
