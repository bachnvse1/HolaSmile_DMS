using System.Security.Claims;
using Application.Constants.Interfaces;
using Application.Services;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.ViewAppointment
{
    public class ViewDetailAppointmentHandler : IRequestHandler<ViewDetailAppointmentCommand, AppointmentDTO>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;
        private readonly IHashIdService _hashIdService;

        public ViewDetailAppointmentHandler(IAppointmentRepository appointmentRepository, IHashIdService hashIdService, IMapper mapper, IHttpContextAccessor httpContextAccessor)
        {
            _appointmentRepository = appointmentRepository;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
            _hashIdService = hashIdService;
        }
        public async Task<AppointmentDTO> Handle(ViewDetailAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            //decode appointment id
            var decodeAppId = _hashIdService.Decode(request.AppointmentId);

            // Check if the user is authenticated
            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException("Bạn cần đăng nhập để thực hiện thao tác này.");
            }

            // Check if the user is a patient and has access to the appointment
            if (string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                // Check if the appointment belongs to the current patient
                if (!await _appointmentRepository.CheckAppointmentByPatientIdAsync(decodeAppId, currentUserId)){
                    throw new Exception("Bạn không có quyền truy cập vào lịch hẹn này");
                }
            }

            // Retrieve the appointment by AppointmentID
            var appointment = await _appointmentRepository.GetAppointmentByIdAsync(decodeAppId);
            if (appointment == null)
            {
                throw new Exception("không tìm thấy dữ liệu cuộc hẹn. ");
            }

            // Map data
            var result = _mapper.Map<AppointmentDTO>(appointment);
            result.AppointmentId = _hashIdService.Encode(appointment.AppointmentId);
            return result;
        }
    }
}
