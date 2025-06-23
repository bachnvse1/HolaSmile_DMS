using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Dentist.ManageSchedule
{
    public class CreateScheduleCommand : IRequest<string>
    {
       public List<CreateScheduleDTO> RegisSchedules { get; set; } = new List<CreateScheduleDTO>();
    }
}
