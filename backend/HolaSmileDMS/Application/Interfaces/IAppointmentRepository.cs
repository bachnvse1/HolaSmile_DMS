namespace Application.Interfaces
{
    public interface IAppointmentRepository
    {
        Task<bool> CreateAppointmentAsync(Appointment appointment);
        Task<List<Appointment>> GetAppointmentsByPatientIdAsync(int patientId);
        Task<List<Appointment>> GetAppointmentsByDentistIdAsync(int dentistId);
        Task<List<Appointment>> GetAllAppointmentAsync();
        Task<Appointment> GetAppointmentByIdAsync(int appointmentId);
        Task<bool> CancelAppointmentAsync(int appId, int cancleBy);
        Task<bool> CheckPatientAppointmentByUserIdAsync(int appId, int userId);
        Task<bool> CheckDentistAppointmentByUserIdAsync(int appId, int userId);
        Task<bool> ExistsAppointmentAsync(int patientId, DateTime date);
        Task<Appointment> GetLatestAppointmentByPatientIdAsync(int patientId);
        Task<bool> UpdateAppointmentAsync(Appointment appointment);


    }
}
