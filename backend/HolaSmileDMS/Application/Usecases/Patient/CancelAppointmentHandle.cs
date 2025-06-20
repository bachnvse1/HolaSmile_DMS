using System.Security.Claims;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patient
{
    public class CancelAppointmentHandle : IRequestHandler<CancelAppointmentCommand, string>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CancelAppointmentHandle(IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor)
        {
            _appointmentRepository = appointmentRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<string> Handle(CancelAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (!string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                return "Bạn không được quyền thực hiện hành động này";
            }
            else
            {
                if (!await _appointmentRepository.CheckAppointmentByPatientIdAsync(request.AppointmentId, currentUserId))
                {
                    throw new Exception("Bạn không có quyền truy cập vào lịch hẹn này");
                }
            }
                var cancleApp = await _appointmentRepository.CancelAppointmentAsync(request.AppointmentId, currentUserId);
            return cancleApp ? "Hủy lịch hẹn thành công" : "Hủy lịch hẹn không thành công, vui lòng thử lại sau";
        }
    }
}
