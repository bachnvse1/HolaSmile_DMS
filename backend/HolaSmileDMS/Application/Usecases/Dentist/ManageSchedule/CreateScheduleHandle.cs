using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.ManageSchedule
{
    public class CreateScheduleHandle : IRequestHandler<CreateScheduleCommand, string>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IDentistRepository _dentistRepository;
        public CreateScheduleHandle(IHttpContextAccessor httpContextAccessor, IDentistRepository dentistRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _dentistRepository = dentistRepository;
        }

        public async Task<string> Handle(CreateScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền thực hiện hành động này.");
            }
            if (request.WorkDate < DateTime.Now)
            {
                return "ngày làm việc không thể trước hôm nay.";
            }
            if (string.IsNullOrEmpty(request.Shift) )
            {
                return "ca làm việc không thể trống";
            }
            var dentist = await _dentistRepository.GetDentistByIdAsync(request.DentistId);
            var weekStart = request.WorkDate.Date.AddDays(-(int)request.WorkDate.DayOfWeek);
            var schedule = new Schedule
            {
                DentistId = dentist.DentistId,
                WorkDate = request.WorkDate,
                Shift = request.Shift,
                Status = request.Status,
                WeekStartDate = weekStart,
                CreatedBy = dentist.DentistId,
                CreatedAt = DateTime.Now
            };
            var result = await _dentistRepository.CreateScheduleAsync(schedule);
            if (result)
            {
                return "Tạo lịch làm việc thành công.";
            }
            else
            {
                return "Tạo lịch làm việc thất bại.";
            }
    }
}
