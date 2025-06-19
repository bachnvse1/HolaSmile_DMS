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
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ViewApponintmentHandler(IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor)
        {
            _appointmentRepository = appointmentRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public Task<List<AppointmentDTO>> Handle(ViewAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (currentUserRole == "patient")
            {
                throw new UnauthorizedAccessException("Bạn không có quyền thực hiện hành động này.");
            }
            var result = _appointmentRepository.GetAllAppointmentAsync();
            if(result == null)
            {
                throw new Exception("Không có dữ liệu");
            }
            return result;
        }
    }
}
