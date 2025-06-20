using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class DentistScheduleDTO
    {
        public int DentistID { get; set; }
        public string DentistName { get; set; }
        public List<ScheduleDTO> schedules { get; set; }
        public Boolean IsAvailable { get; set; }
    }
}
