using System.Security.Claims;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.ViewAppointment
{
    public class ViewDetailAppointmentHandler : IRequestHandler<ViewDetailAppointmentCommand, AppointmentDTO>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public ViewDetailAppointmentHandler(IAppointmentRepository appointmentRepository, IUserCommonRepository userCommonRepository, IMapper mapper, IHttpContextAccessor httpContextAccessor)
        {
            _appointmentRepository = appointmentRepository;
            _userCommonRepository = userCommonRepository;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }
        public async Task<AppointmentDTO> Handle(ViewDetailAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Check if the user is authenticated
            //if (currentUserRole == null)      
            //{
            //    throw new UnauthorizedAccessException("Bạn cần đăng nhập để thực hiện thao tác này.");
            //}

            // Check if the user is a patient and has access to the appointment
            if (string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                // Check if the appointment belongs to the current patient
                if (!await _appointmentRepository.CheckPatientAppointmentByUserIdAsync(request.AppointmentId, currentUserId)){
                    throw new Exception("Bạn không có quyền truy cập vào lịch hẹn này");
                }
            }
            else if (string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                // Check if the appointment belongs to the current patient
                if (!await _appointmentRepository.CheckDentistAppointmentByUserIdAsync(request.AppointmentId, currentUserId))
                {
                    throw new Exception("Bạn không có quyền truy cập vào lịch hẹn này");
                }
            }

            // Retrieve the appointment by AppointmentID
            var appointment = await _appointmentRepository.GetDetailAppointmentByAppointmentIDAsync(request.AppointmentId);
            if (appointment == null)
            {
                throw new Exception("không tìm thấy dữ liệu cuộc hẹn. ");
            }

            var createdby = await _userCommonRepository.GetByIdAsync(Int32.Parse(appointment.CreatedBy), cancellationToken);
            var updatedby = await _userCommonRepository.GetByIdAsync(Int32.Parse(appointment.UpdatedBy), cancellationToken);

            appointment.CreatedBy = createdby != null ? createdby.Fullname : "";
            appointment.UpdatedBy = updatedby != null ? updatedby.Fullname : "";
            // Map data
            //var result = _mapper.Map<AppointmentDTO>(appointment);
            //result.AppointmentId = appointment.AppointmentId;
            return appointment;
        }
    }
}
