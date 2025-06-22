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
    public class ViewAllDentistSchedulehandler : IRequestHandler<ViewAllDentistScheduleCommand, List<DentistScheduleDTO>>
    {
        private readonly IDentistRepository _dentistRepository;
        private readonly IScheduleRepository _scheduleRepository;
        private readonly IHashIdService _hashIdService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ViewAllDentistSchedulehandler(IDentistRepository dentistRepository, IHashIdService hashIdService, IScheduleRepository scheduleRepository, IHttpContextAccessor httpContextAccessor  )
        {
            _dentistRepository = dentistRepository;
            _hashIdService = hashIdService;
            _httpContextAccessor = httpContextAccessor;
            _scheduleRepository = scheduleRepository;
        }
        public async Task<List<DentistScheduleDTO>> Handle(ViewAllDentistScheduleCommand request, CancellationToken cancellationToken)
        {
            var schedules = await _scheduleRepository.GetAllDentistSchedulesAsync();
            if(schedules == null)
            {
                throw new Exception(MessageConstants.MSG.MSG16);
            }

            var result = schedules.GroupBy(s => s.DentistId)
                .Select(g => new DentistScheduleDTO
                {
                    DentistID = _hashIdService.Encode(g.First().DentistId),
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
                    IsAvailable = g.First().Dentist.Appointments.Count < 5 // Assuming 5 is the max appointments allowed
                }).ToList();
            return result;
        }
    }
}
