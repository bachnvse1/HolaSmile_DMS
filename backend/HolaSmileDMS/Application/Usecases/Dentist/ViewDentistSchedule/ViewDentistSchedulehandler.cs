using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Interfaces;
using MediatR;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewDentistSchedulehandler : IRequestHandler<ViewDentistScheduleCommand, List<DentistScheduleDTO>>
    {
        private readonly IDentistRepository _dentistRepository;
        public ViewDentistSchedulehandler(IDentistRepository dentistRepository)
        {
            _dentistRepository = dentistRepository;
        }
        public async Task<List<DentistScheduleDTO>> Handle(ViewDentistScheduleCommand request, CancellationToken cancellationToken)
        {
            var result = await _dentistRepository.GetAllDentistScheduleAsync();
            if(result == null || !result.Any())
            {
                throw new Exception("Không có lịch trình nào của bác sĩ.");
            }
            return result;
        }
    }
}
