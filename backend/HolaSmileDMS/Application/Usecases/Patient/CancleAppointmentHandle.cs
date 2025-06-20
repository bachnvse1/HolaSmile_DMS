using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patient
{
    public class CancleAppointmentHandle : IRequestHandler<CancleAppointmentCommand, string>
    {
        private readonly IPatientRepository _patientRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CancleAppointmentHandle(IPatientRepository patientRepository, IHttpContextAccessor httpContextAccessor)
        {
            _patientRepository = patientRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<string> Handle(CancleAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (!string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                return "Bạn không được quyền thực hiện hành động này";
            }
            var cancleApp = await _patientRepository.CancleAppointmentAsync(request.AppointmentId, currentUserId);
            return cancleApp ? "Hủy lịch hẹn thành công" : "Hủy lịch hẹn không thành công, vui lòng thử lại sau";
        }
    }
}
