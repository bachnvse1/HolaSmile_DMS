using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using NuGet.Protocol.Plugins;

namespace Application.Usecases.Receptionist.ChangeAppointmentStatus
{
    public class ChangeAppointmentStatusHandler : IRequestHandler<ChangeAppointmentStatusCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAppointmentRepository _appointmentRepository;


        public ChangeAppointmentStatusHandler(IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
            _appointmentRepository = appointmentRepository;
        }
        public async Task<bool> Handle(ChangeAppointmentStatusCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            var existApp = await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId);
            if (existApp == null)
            {
                throw new Exception(MessageConstants.MSG.MSG28); // "Không tìm thấy lịch hẹn"
            }

            if (request.Status.ToLower() == "attended")
            {
                existApp.Status = "attended";
            }
            else if (request.Status.ToLower() == "absented")
            {
                existApp.Status = "absented";
            }

            existApp.UpdatedAt = DateTime.Now;
            existApp.UpdatedBy = currentUserId;

            var isUpdate = await _appointmentRepository.UpdateAppointmentAsync(existApp);
            return isUpdate;
        }
    }
}
