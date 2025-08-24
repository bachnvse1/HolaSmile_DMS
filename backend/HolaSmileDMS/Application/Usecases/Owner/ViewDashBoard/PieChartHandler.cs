using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewAppointment;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Owner.ViewDashBoard
{
    public class PieChartHandler : IRequestHandler<PieChartCommand, PieChartDto>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PieChartHandler(
            IAppointmentRepository appointmentRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _appointmentRepository = appointmentRepository ?? throw new ArgumentNullException(nameof(appointmentRepository));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        }

        public async Task<PieChartDto> Handle(PieChartCommand request, CancellationToken cancellationToken)
        {
            // Kiểm tra quyền Owner (bật lại nếu cần)
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var appointmentDtos = await _appointmentRepository.GetAllAppointmentAsync()
                                         ?? new List<AppointmentDTO>();

            var now = DateTime.Now;
            var filter = string.IsNullOrEmpty(request.Filter) ? "week" : request.Filter.ToLower();

            switch (filter)
            {
                case "week":
                    {
                        var start = now.Date.AddDays(-6);
                        var end = now.Date.AddDays(1);
                        return CountByStatusInRange(appointmentDtos, start, end);
                    }
                case "month":
                    {
                        var start = new DateTime(now.Year, now.Month, 1);
                        var end = now.Date.AddDays(1); // chỉ đến hôm nay
                        return CountByStatusInRange(appointmentDtos, start, end);
                    }
                case "year":
                    {
                        var start = new DateTime(now.Year, 1, 1);
                        var end = new DateTime(now.Year, now.Month, 1).AddMonths(1); // hết tháng hiện tại
                        return CountByStatusInRange(appointmentDtos, start, end);
                    }
                default:
                    {
                        // fallback: week
                        var start = now.Date.AddDays(-6);
                        var end = now.Date.AddDays(1);
                        return CountByStatusInRange(appointmentDtos, start, end);
                    }
            }
        }

        private static PieChartDto CountByStatusInRange(
            IEnumerable<AppointmentDTO> appointments,
            DateTime startInclusive,
            DateTime endExclusive)
        {
            // Nếu bạn muốn dùng AppointmentDate, đổi CreatedAt -> AppointmentDate
            var range = appointments.Where(a => a.CreatedAt >= startInclusive && a.CreatedAt < endExclusive);

            int confirmed = 0, attended = 0, absented = 0, canceled = 0;

            foreach (var a in range)
            {
                var s = a.Status?.Trim().ToLowerInvariant();
                switch (s)
                {
                    case "confirmed": confirmed++; break;
                    case "attended": attended++; break;
                    case "absented": absented++; break;
                    case "canceled": canceled++; break;
                    default: break; // trạng thái khác thì bỏ qua
                }
            }

            return new PieChartDto
            {
                Confirmed = confirmed,
                Attended = attended,
                Absented = absented,
                Canceled = canceled
            };
        }
    }
}
