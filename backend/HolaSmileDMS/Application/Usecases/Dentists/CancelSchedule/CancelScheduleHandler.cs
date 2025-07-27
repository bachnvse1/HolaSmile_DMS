using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.CancelSchedule
{
    public class CancelScheduleHandler : IRequestHandler<CancelScheduleCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IDentistRepository _dentistRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;

        public CancelScheduleHandler(IHttpContextAccessor httpContextAccessor, IScheduleRepository scheduleRepository, IDentistRepository dentistRepository, IOwnerRepository ownerRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _dentistRepository = dentistRepository;
            _ownerRepository = ownerRepository;
            _scheduleRepository = scheduleRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(CancelScheduleCommand request, CancellationToken cancellationToken)
        {
            // Lấy thông tin người dùng hiện tại
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."
            }

            // Giải mã ScheduleId và lấy lịch làm việc
            var schedule = await _scheduleRepository.GetScheduleByIdAsync(request.ScheduleId);
            if (schedule == null)
            {
                throw new Exception(MessageConstants.MSG.MSG28);
            }

            // Kiểm tra quyền của người dùng (chỉ Dentist được sửa)
            if (!string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            // Lấy thông tin Dentist hiện tại
            var dentist = await _dentistRepository.GetDentistByUserIdAsync(currentUserId);
            if (dentist == null || schedule.DentistId != dentist.DentistId)
            {
                throw new Exception(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này."
            }

            // Nếu lịch chưa được Owner duyệt ,cập nhật lịch thẳng
            if (schedule.Status == "pending")
            {
                var Isdelete = await _scheduleRepository.DeleteSchedule(request.ScheduleId, currentUserId);

                // Send notification to owner and dentist
                try
                {
                    var owners = await _ownerRepository.GetAllOwnersAsync();

                    var notifyOwners = owners.Select(async o =>
                    await _mediator.Send(new SendNotificationCommand(
                          o.User.UserID,
                          "Đăng ký lịch làm việc",
                          $"Nha Sĩ {o.User.Fullname} đã hủy đăng ký lịch làm việc vào lúc {DateTime.Now}",
                          "schedule", 0,$"schedules"),
                    cancellationToken));
                    await System.Threading.Tasks.Task.WhenAll(notifyOwners);
                }
                catch { }
                return Isdelete;
            }
            else
            {
                throw new Exception("Lịch làm việc đã được duyệt, không thể chỉnh sửa."); // "Schedule has been approved, cannot edit."
            }
        }
    }
}