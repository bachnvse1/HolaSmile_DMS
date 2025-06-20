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
    public class ViewApponintmentHandler : IRequestHandler<ViewAppointmentCommand, List<AppointmentDTO>>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ViewApponintmentHandler(IUserCommonRepository userCommonRepository, IHttpContextAccessor httpContextAccessor,IPatientRepository patientRepository)
        {
            _userCommonRepository = userCommonRepository;
            _patientRepository = patientRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<List<AppointmentDTO>> Handle(ViewAppointmentCommand request, CancellationToken cancellationToken)
        {
            var result = new List<AppointmentDTO>();
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException("Bạn cần đăng nhập để thực hiện thao tác này.");
            }

            if(string.Equals(currentUserRole,"patient",StringComparison.OrdinalIgnoreCase))
            {
                result = await _patientRepository.GetAppointmentsByPatientIdAsync(currentUserId);
            }
            else
            {
                result = await _userCommonRepository.GetAllAppointmentAsync();
            }
            if(result == null)
            {
                throw new Exception("Không có dữ liệu");
            }
            return result;
        }
    }
}
