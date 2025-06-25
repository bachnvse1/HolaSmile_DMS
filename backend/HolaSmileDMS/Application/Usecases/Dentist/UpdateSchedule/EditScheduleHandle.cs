using System.Security.Claims;
using Application.Constants;
using Application.Constants.Interfaces;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.UpdateSchedule
{
    public class EditScheduleHandle : IRequestHandler<EditScheduleCommand, string>
    {
        private readonly IDentistRepository _dentistRepository;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditScheduleHandle(IDentistRepository dentistRepository, IScheduleRepository scheduleRepository, IHttpContextAccessor httpContextAccessor)
        {
            _dentistRepository = dentistRepository;
            _httpContextAccessor = httpContextAccessor;
            _scheduleRepository = scheduleRepository;
        }
        public async Task<string> Handle(EditScheduleCommand request, CancellationToken cancellationToken)
        {
            // Lấy thông tin người dùng hiện tại
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

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
                // Kiểm tra trùng lịch với lịch khác (ngoại trừ chính lịch này)
                var isDuplicate = await _scheduleRepository.CheckDulplicateScheduleAsync(
                    dentist.DentistId,
                    request.WorkDate,
                    request.Shift,
                    schedule.ScheduleId
                );

                if (isDuplicate)
                {
                    throw new Exception(MessageConstants.MSG.MSG51); // "Xung đột với lịch làm việc hiện tại."
                }

                // Cập nhật thông tin lịch làm việc
                schedule.WorkDate = request.WorkDate;
                schedule.Shift = request.Shift;
                schedule.UpdatedAt = DateTime.Now;
                schedule.UpdatedBy = currentUserId;

                var updated = await _scheduleRepository.UpdateScheduleAsync(schedule);
                return updated ? MessageConstants.MSG.MSG52 : MessageConstants.MSG.MSG58;
            }
            else
            {
                // Nếu đã được owenr duyệt , xóa mềm lịch cũ và tạo lịch mới 
                var deleted = await _scheduleRepository.DeleteSchedule(schedule.ScheduleId);
                if (!deleted)
                {
                    throw new Exception(MessageConstants.MSG.MSG58); // Cập nhật dữ liệu thất bại

                }
                // Tạo lịch làm việc mới
                var newSchedule = new Schedule
                {
                    DentistId = schedule.DentistId,
                    WorkDate = request.WorkDate,
                    Shift = request.Shift,
                    WeekStartDate = schedule.WeekStartDate,
                    Status = "pending",
                    CreatedAt = DateTime.Now,
                    CreatedBy = currentUserId,
                    IsActive = true
                };

                var created = await _scheduleRepository.RegisterScheduleByDentist(newSchedule);
                return created? MessageConstants.MSG.MSG52 : MessageConstants.MSG.MSG58;

            }
        }
    }

}
