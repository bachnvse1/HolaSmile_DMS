using Application.Usecases.Dentist.ViewAllDentistSchedule;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class DentistScheduleDTO
    {
        public int DentistID { get; set; }
        public string DentistName { get; set; }
        public string Avatar { get; set; }
        public List<ScheduleDTO> Schedules { get; set; }
    }
}
