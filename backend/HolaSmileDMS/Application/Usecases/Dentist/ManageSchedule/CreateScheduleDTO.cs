using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.Dentist.ManageSchedule
{
    public class CreateScheduleDTO
    {
        public DateTime WorkDate { get; set; }
        public string Shift { get; set; } // "Morning", "Afternoon", "Evening"
        public DateTime WeekStartDate { get; set; }

    }
}
