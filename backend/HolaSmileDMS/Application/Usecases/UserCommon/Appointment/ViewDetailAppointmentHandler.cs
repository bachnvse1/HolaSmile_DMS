using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.Appointment
{
    public class ViewDetailAppointmentHandler : IRequestHandler<ViewDetailAppointmentCommand, AppointmentDTO>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ViewDetailAppointmentHandler(IUserCommonRepository userCommonRepository, IHttpContextAccessor httpContextAccessor)
        {
            _userCommonRepository = userCommonRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<AppointmentDTO> Handle(ViewDetailAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException("Bạn cần đăng nhập để thực hiện thao tác này.");
            }

            if (string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
            }

            var appointment = await _userCommonRepository.GetAppointmentByIdAsync(request.AppointmentId);
            if (appointment == null)
            {
                throw new Exception("không tìm thấy dữ liệu cuộc hẹn. ");
            }
            return appointment;
        }
    }
}
