using System.Security.Claims;
using AutoMapper;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.ViewAppointment
{
    public class ViewAppointmentHandler : IRequestHandler<ViewAppointmentCommand, List<AppointmentDTO>>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;


        public ViewAppointmentHandler(IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor, IMapper mapper)
        {
            _appointmentRepository = appointmentRepository;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }
        public async Task<List<AppointmentDTO>> Handle(ViewAppointmentCommand request, CancellationToken cancellationToken)
        {
            var listApp = new List<Appointment>();
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            //check authen
            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException("Bạn cần đăng nhập để thực hiện thao tác này.");
            }

            //check if patient, only view appointment of patient, else see all
            if(string.Equals(currentUserRole,"patient",StringComparison.OrdinalIgnoreCase))
            {
                listApp = await _appointmentRepository.GetAppointmentsByPatientIdAsync(currentUserId);
            }
            else if(string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                listApp = await _appointmentRepository.GetAppointmentsByDentistIdAsync(currentUserId);
            }
            else
            {
                listApp = await _appointmentRepository.GetAllAppointmentAsync();
            }
            if(listApp == null)
            {
                throw new Exception("Không có dữ liệu");
            }

            //mapping data
            var result = _mapper.Map<List<AppointmentDTO>>(listApp);
            return result;
        }
    }
}
