using System.Security.Claims;
using Application.Constants;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patients.CancelAppointment
{
    public class CancleAppointmentHandle : IRequestHandler<CancleAppointmentCommand, string>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAppointmentRepository _appointmentRepository;
        public CancleAppointmentHandle(IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
            _appointmentRepository = appointmentRepository;
        }
        public async Task<string> Handle(CancleAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                return MessageConstants.MSG.MSG26; // "Bạn không có quyền truy cập chức năng này"
            }
            var cancleApp = await _appointmentRepository.CancelAppointmentAsync(request.AppointmentId, currentUserId);
            return cancleApp ? MessageConstants.MSG.MSG06 : MessageConstants.MSG.MSG58;
        }
    }
    }
