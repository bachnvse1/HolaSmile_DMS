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
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public ViewDetailScheduleHandle(IDentistRepository dentistRepository, IMapper mapper, IScheduleRepository scheduleRepository, IUserCommonRepository userCommonRepository, IHttpContextAccessor httpContextAccessor)
        {
            _dentistRepository = dentistRepository;
            _httpContextAccessor = httpContextAccessor;
            _userCommonRepository = userCommonRepository;
            _scheduleRepository = scheduleRepository;
            _mapper = mapper;
        }
        public async Task<ScheduleDTO> Handle(ViewDetailScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (currentUserRole == null) throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."

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

            var createdby = await _userCommonRepository.GetByIdAsync(schedule.CreatedBy, cancellationToken);
            var updatedby = await _userCommonRepository.GetByIdAsync(schedule.UpdatedBy, cancellationToken);

            var result = _mapper.Map<ScheduleDTO>(schedule);
            result.createdBy = createdby?.Fullname ?? "";
            result.updatedBy = updatedby?.Fullname ?? "";
            return result;
        }

    }
}
