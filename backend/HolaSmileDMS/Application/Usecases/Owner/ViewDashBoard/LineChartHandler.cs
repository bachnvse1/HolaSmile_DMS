using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewAppointment;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Owner.ViewDashBoard
{
    public class LineChartHandler : IRequestHandler<LineChartCommand, LineChartDto>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LineChartHandler(
            IAppointmentRepository appointmentRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _appointmentRepository = appointmentRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<LineChartDto> Handle(LineChartCommand request, CancellationToken cancellationToken)
        {
            // Kiểm tra quyền Owner
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            // Lấy tất cả lịch hẹn
            var appointmentDtos = await _appointmentRepository.GetAllAppointmentAsync() ?? new List<AppointmentDTO>();

            // Xác định tuần hiện tại (thứ 2 -> CN)
            var today = DateTime.Now.Date;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1); // Monday
            if (startOfWeek > today) startOfWeek = startOfWeek.AddDays(-7); // fix nếu CN = 0

            var daysOfWeek = Enumerable.Range(0, 7)
                                       .Select(offset => startOfWeek.AddDays(offset))
                                       .ToList();

            var result = new LineChartDto();

            foreach (var day in daysOfWeek)
            {
                var totalAppointments = appointmentDtos.Count(a => a.CreatedAt.Date == day.Date);
                result.Data.Add(new LineChartItemDto
                {
                    Label = GetDayLabel(day.DayOfWeek),
                    TotalAppointments = totalAppointments
                });
            }

            return result;
        }

        private string GetDayLabel(DayOfWeek dayOfWeek)
        {
            return dayOfWeek switch
            {
                DayOfWeek.Monday => "T2",
                DayOfWeek.Tuesday => "T3",
                DayOfWeek.Wednesday => "T4",
                DayOfWeek.Thursday => "T5",
                DayOfWeek.Friday => "T6",
                DayOfWeek.Saturday => "T7",
                DayOfWeek.Sunday => "CN",
                _ => ""
            };
        }
    }
}
