using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.Guests.AskChatBot
{
    public sealed class ClinicDataDto
    {
        public ClinicInfo Clinic_Info { get; set; } = new();
        public List<string> Procedures { get; set; } = new();
        public Contact Contacts { get; set; } = new();
        public List<string> Promotions { get; set; } = new();
        public List<string> DentistName { get; set; } = new();
        public List<DentistScheduleData> DentistSchedules { get; set; } = new();

        //public string? Versions { get; set; }
        //public DateTime UpdatedAt { get; set; }

        public sealed class ClinicInfo { public string Name { get; set; } = "Hola Smile"; public string Address { get; set; } = "36 Thạch Hòa Thạch Thất Hà Nội"; public string Opening_Hours { get; set; } = "8h-20h các ngày trong tuần"; }
        public sealed class Contact { public string Phone { get; set; } = "0993133593"; public string Zalo { get; set; } = "0993133593"; public string Email { get; set; } = "phucz2103@gmail.com"; }
    }

    public sealed class DentistScheduleData
    {
        public string DentistName { get; set; } = "";
        public string Date { get; set; } = "";          // yyyy-MM-dd
        public List<string> Shift { get; set; } = new();
    }
}
