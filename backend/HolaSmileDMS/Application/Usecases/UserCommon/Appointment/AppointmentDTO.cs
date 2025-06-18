using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.UserCommon.Appointment
{
    public class AppointmentDTO
    {
        public int AppointmentId { get; set; }
        public string PatientName { get; set; }
        public string DentistName { get; set; }
        public DateTime AppointmentDate { get; set; }
        public TimeSpan AppointmentTime { get; set; }
        public string Content { get; set; }
        public string AppointmentType { get; set; }
        public bool IsNewPatient { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int? CreatedBy { get; set; }
        public int? UpdatedBy { get; set; }

    }
}
