using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Constants.Interfaces;
using Application.Services;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.UpdateSchedule
{
    public class EditScheduleHandle : IRequestHandler<EditScheduleCommand, string>
    {
        private readonly IDentistRepository _dentistRepository;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IHashIdService _hashIdService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public EditScheduleHandle(IDentistRepository dentistRepository, IHashIdService hashIdService, IMapper mapper, IScheduleRepository scheduleRepository, IHttpContextAccessor httpContextAccessor)
        {
            _dentistRepository = dentistRepository;
            _hashIdService = hashIdService;
            _httpContextAccessor = httpContextAccessor;
            _scheduleRepository = scheduleRepository;
            _mapper = mapper;
        }
        public async Task<string> Handle(EditScheduleCommand request, CancellationToken cancellationToken)
        {
            // Lấy thông tin người dùng hiện tại
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Giải mã ScheduleId và lấy lịch làm việc
            var scheduleId = _hashIdService.Decode(request.ScheduleId);
            var schedule = await _scheduleRepository.GetScheduleByIdAsync(scheduleId);
            if (schedule == null)
            {
                throw new Exception("Lịch hẹn không tồn tại.");
            }

            // Kiểm tra quyền của người dùng (chỉ Dentist được sửa)
            if (!string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa lịch làm việc.");
            }

            // Lấy thông tin Dentist hiện tại
            var dentist = await _dentistRepository.GetDentistByUserIdAsync(currentUserId);
            if (dentist == null || schedule.DentistId != dentist.DentistId)
            {
                throw new Exception(MessageConstants.MSG.MSG26 ?? "Bạn không phải người sở hữu lịch này.");
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
                    throw new Exception(MessageConstants.MSG.MSG51 ?? "Xung đột với lịch làm việc hiện tại.");
                }

                // Cập nhật thông tin lịch làm việc
                schedule.WorkDate = request.WorkDate;
                schedule.Shift = request.Shift;
                schedule.UpdatedAt = DateTime.Now;
                schedule.UpdatedBy = dentist.DentistId;

                var updated = await _scheduleRepository.UpdateScheduleAsync(schedule);
                return updated
                    ? MessageConstants.MSG.MSG52 ?? "Cập nhật lịch làm việc thành công."
                    : "Cập nhật lịch làm việc thất bại.";
            }
            else
            {
                // Nếu đã được owenr duyệt , xóa mềm lịch cũ và tạo lịch mới 
                var deleted = await _scheduleRepository.DeleteSchedule(schedule.ScheduleId);
                if (!deleted)
                {
                    throw new Exception("Xoá lịch làm việc cũ thất bại.");
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
                    CreatedBy = dentist.DentistId,
                    IsActive = true
                };

                var created = await _scheduleRepository.RegisterScheduleByDentist(newSchedule);
                return created
                    ? MessageConstants.MSG.MSG52 ?? "Đã đăng ký lịch làm việc thành công. Bạn phải chờ chủ xác nhận."
                    : "Thay đổi lịch làm việc thất bại.";
            }
        }
    }

}
