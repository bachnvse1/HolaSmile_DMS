using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.Dentist.ViewAllDentistSchedule
{
    public class ScheduleDTO
    {
        public int ScheduleId { get; set; }
        public string DentistName { get; set; } 
        public DateTime WorkDate { get; set; }
        public string Shift { get; set; } // e.g., "Morning", "Afternoon", "Evening"
        public string Status { get; set; } // e.g., "approved", "pending", "rejected" 
        public string createdBy { get; set; } // Username of the creator
        public string updatedBy { get; set; } // Username of the updater
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
