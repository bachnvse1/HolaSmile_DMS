
using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Services;
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
        private readonly IHashIdService _hashIdService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public ViewDetailScheduleHandle(IDentistRepository dentistRepository, IHashIdService hashIdService, IMapper mapper, IScheduleRepository scheduleRepository, IHttpContextAccessor httpContextAccessor)
        {
            _dentistRepository = dentistRepository;
            _hashIdService = hashIdService;
            _httpContextAccessor = httpContextAccessor;
            _scheduleRepository = scheduleRepository;
            _mapper = mapper;
        }
        public async Task<ScheduleDTO> Handle(ViewDetailScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."

            var currentUserRole = user.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (string.IsNullOrWhiteSpace(request.ScheduleId))
                throw new ArgumentException("Mã lịch không hợp lệ.");

            var scheduleId = _hashIdService.Decode(request.ScheduleId);
            var schedule = await _scheduleRepository.GetScheduleByIdAsync(scheduleId);

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
