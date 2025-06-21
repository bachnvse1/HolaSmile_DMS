using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewDentistScheduleHandle : IRequestHandler<ViewDentistScheduleCommand, List<DentistScheduleDTO>>
    {
        private readonly IDentistRepository _dentistRepository;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IHashIdService _hashIdService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ViewDentistScheduleHandle(IDentistRepository dentistRepository, IHashIdService hashIdService, IScheduleRepository scheduleRepository, IHttpContextAccessor httpContextAccessor)
        {
            _dentistRepository = dentistRepository;
            _hashIdService = hashIdService;
            _httpContextAccessor = httpContextAccessor;
            _scheduleRepository = scheduleRepository;
        }
        public async Task<List<DentistScheduleDTO>> Handle(ViewDentistScheduleCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var decodedDentistId = _hashIdService.Decode(request.DentistId);

            // Nếu người dùng là dentist -> chỉ cho xem lịch của chính mình
            if (string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                var currentDentist = await _dentistRepository.GetDentistByUserIdAsync(currentUserId);
                if (currentDentist == null || currentDentist.DentistId != decodedDentistId)
                {
                    throw new UnauthorizedAccessException("Bạn không có quyền xem lịch của dentist này.");
                }
            }
            else if (!string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase)
                  && !string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xem lịch của dentist.");
            }

            var schedules = await _scheduleRepository.GetDentistSchedulesByDentistIdAsync(decodedDentistId);

            if (schedules == null || !schedules.Any())
            {
                return new List<DentistScheduleDTO>();
            }

            var result = schedules.GroupBy(s => s.DentistId)
                .Select(g => new DentistScheduleDTO
                {
                    DentistID = _hashIdService.Encode(g.Key),
                    DentistName = g.First().Dentist.User.Fullname,
                    Avatar = g.First().Dentist.User.Avatar,
                    schedules = g.Select(s => new ScheduleDTO
                    {
                        ScheduleId = _hashIdService.Encode(s.ScheduleId),
                        WorkDate = s.WorkDate.Date,
                        Shift = s.Shift,
                        CreatedAt = s.CreatedAt.Date,
                        UpdatedAt = s.UpdatedAt?.Date
                    }).ToList(),
                    IsAvailable = g.First().Dentist.Appointments.Count < 5
                }).ToList();

            return result;
        }
    }
}
