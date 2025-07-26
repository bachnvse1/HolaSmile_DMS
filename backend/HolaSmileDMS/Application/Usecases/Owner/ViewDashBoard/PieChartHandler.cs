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
            _appointmentRepository = appointmentRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<PieChartDto> Handle(PieChartCommand request, CancellationToken cancellationToken)
        {
            // Kiểm tra quyền Owner
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            // Lấy dữ liệu appointment
            var appointments = await _appointmentRepository.GetAllAppointmentAsync() ?? new List<AppointmentDTO>();

            // Xác định tháng hiện tại
            var now = DateTime.Now;
            var monthAppointments = appointments
                .Where(a => a.AppointmentDate.Month == now.Month && a.AppointmentDate.Year == now.Year);

            // Đếm theo trạng thái
            var confirmed = monthAppointments.Count(a => a.Status?.Equals("confirmed", StringComparison.OrdinalIgnoreCase) == true);
            var attended = monthAppointments.Count(a => a.Status?.Equals("attended", StringComparison.OrdinalIgnoreCase) == true);
            var absented = monthAppointments.Count(a => a.Status?.Equals("absented", StringComparison.OrdinalIgnoreCase) == true);
            var canceled = monthAppointments.Count(a => a.Status?.Equals("canceled", StringComparison.OrdinalIgnoreCase) == true);

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
