using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ScheduleDTO
    {
        public int ScheduleId { get; set; }
        public DateTime WorkDate { get; set; }
        public string Shift { get; set; }
        public string Status { get; set; }
    }
}
