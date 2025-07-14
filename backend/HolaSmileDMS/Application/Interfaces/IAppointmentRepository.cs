using Application.Usecases.UserCommon.ViewAppointment;

namespace Application.Interfaces
{
    public interface IAppointmentRepository
    {
        Task<bool> CreateAppointmentAsync(Appointment appointment);
        Task<List<AppointmentDTO>> GetAppointmentsByPatientIdAsync(int patientId);
        Task<List<AppointmentDTO>> GetAppointmentsByDentistIdAsync(int dentistId);
        Task<List<AppointmentDTO>> GetAllAppointmentAsync();
        Task<AppointmentDTO> GetDetailAppointmentByAppointmentIDAsync(int appointmentId);
        Task<Appointment> GetAppointmentByIdAsync(int appointmentId);
        Task<bool> CancelAppointmentAsync(int appId, int cancleBy);
        Task<bool> CheckPatientAppointmentByUserIdAsync(int appId, int userId);
        Task<bool> CheckDentistAppointmentByUserIdAsync(int appId, int userId);
        Task<bool> ExistsAppointmentAsync(int patientId, DateTime date);
        Task<Appointment> GetLatestAppointmentByPatientIdAsync(int? patientId);
        Task<bool> UpdateAppointmentAsync(Appointment appointment);


    }
}
