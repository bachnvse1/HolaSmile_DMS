namespace Application.Usecases.Dentist.ManageSchedule
{
    public class CreateScheduleDTO
    {
        public DateTime WorkDate { get; set; }
        public string Shift { get; set; } // "Morning", "Afternoon", "Evening"
    }
}
