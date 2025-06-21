using Application.Usecases.Dentist.ViewAllDentistSchedule;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class DentistScheduleDTO
    {
        public string DentistID { get; set; }
        public string DentistName { get; set; }
        public string Avatar { get; set; }
        public List<ScheduleDTO> schedules { get; set; }
        public Boolean IsAvailable { get; set; }
    }
}
