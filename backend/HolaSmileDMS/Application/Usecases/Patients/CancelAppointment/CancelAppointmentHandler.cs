using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Services;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patients.CancelAppointment
{
    public class CancleAppointmentHandle : IRequestHandler<CancleAppointmentCommand, string>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IHashIdService _hashIdService;
        private readonly IAppointmentRepository _appointmentRepository;
        public CancleAppointmentHandle(IHashIdService hashIdService, IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
            _hashIdService = hashIdService;
            _appointmentRepository = appointmentRepository;
        }
        public async Task<string> Handle(CancleAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var decodedAppointmentId = _hashIdService.Decode(request.AppointmentId);

            if (!string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                return MessageConstants.MSG.MSG26; // "Bạn không có quyền truy cập chức năng này"
            }
            var cancleApp = await _appointmentRepository.CancelAppointmentAsync(decodedAppointmentId, currentUserId);
            return cancleApp ? MessageConstants.MSG.MSG06 : MessageConstants.MSG.MSG58;
        }
    }
    }
