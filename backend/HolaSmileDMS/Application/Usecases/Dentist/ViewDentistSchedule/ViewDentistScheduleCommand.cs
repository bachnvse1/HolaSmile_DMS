using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using MediatR;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewDentistScheduleCommand : IRequest<List<DentistScheduleDTO>>
    {
        public string DentistId { get; set; }
    }
}
