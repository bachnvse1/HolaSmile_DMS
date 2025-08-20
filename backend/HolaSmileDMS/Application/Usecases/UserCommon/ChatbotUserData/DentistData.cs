using Application.Usecases.Dentist.ViewDentistSchedule;
using Application.Usecases.Guests.AskChatBot;

namespace Application.Usecases.UserCommon.ChatbotUserData
{
    public sealed class DentistData
    {
        public string Scope { get; set; } = string.Empty;
        public List<AppointmentData> Appointments { get; set; } = new List<AppointmentData>(); 
        public List<DentistScheduleDTO> DentistSchedules { get; set; } = new List<DentistScheduleDTO>();

    }
}
