using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Dentist.UpdateSchedule
{
    public class EditScheduleCommand : IRequest<string>
    {
        public string ScheduleId { get; set; }
        public DateTime WorkDate { get; set; }
        public string Shift { get; set; }
    }
}
