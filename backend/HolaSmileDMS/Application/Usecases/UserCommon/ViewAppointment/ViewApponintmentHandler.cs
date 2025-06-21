using System.Security.Claims;
using Application.Services;
using AutoMapper;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.ViewAppointment
{
    public class ViewApponintmentHandler : IRequestHandler<ViewAppointmentCommand, List<AppointmentDTO>>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;
        private readonly IHashIdService _hashIdService;

        public ViewApponintmentHandler(IUserCommonRepository userCommonRepository, IHashIdService hashIdService, IHttpContextAccessor httpContextAccessor, IMapper mapper, IAppointmentRepository appointmentRepository)
        {
            _userCommonRepository = userCommonRepository;
            _appointmentRepository = appointmentRepository;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
            _hashIdService = hashIdService;
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
            for (int i = 0; i < result.Count; i++)
            {
                result[i].AppointmentId = _hashIdService.Encode(listApp[i].AppointmentId);
            }
            return result;
        }
    }
}
