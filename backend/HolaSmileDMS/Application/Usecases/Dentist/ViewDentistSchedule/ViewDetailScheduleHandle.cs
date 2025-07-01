using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewDetailScheduleHandle : IRequestHandler<ViewDetailScheduleCommand, ScheduleDTO>
    {
        private readonly IDentistRepository _dentistRepository;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public ViewDetailScheduleHandle(IDentistRepository dentistRepository, IMapper mapper, IScheduleRepository scheduleRepository, IHttpContextAccessor httpContextAccessor)
        {
            _dentistRepository = dentistRepository;
            _httpContextAccessor = httpContextAccessor;
            _scheduleRepository = scheduleRepository;
            _mapper = mapper;
        }
        public async Task<ScheduleDTO> Handle(ViewDetailScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (user == null) throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."

            var schedule = await _scheduleRepository.GetScheduleByIdAsync(request.ScheduleId);

            if (schedule == null)
                throw new Exception(MessageConstants.MSG.MSG28); // "Không tìm thấy lịch hẹn"

            // Dentist role check
            if (string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                var dentist = await _dentistRepository.GetDentistByUserIdAsync(currentUserId);
                if (dentist == null || schedule.DentistId != dentist.DentistId)
                    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập..."
            }

            return _mapper.Map<ScheduleDTO>(schedule);
        }

    }
}
