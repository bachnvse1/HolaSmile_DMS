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
        public int DentistId { get; set; }
        public DateTime WorkDate { get; set; }
        public string Shift { get; set; } // "Morning", "Afternoon", "Evening"
        public string Status { get; set; } = "pending"; // mặc định trạng thái lịch
        public int CreatedBy { get; set; }
    }
}
