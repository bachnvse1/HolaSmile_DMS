using Application.Usecases.UserCommon.Appointment;
using HDMS_API.Application.Usecases.Guests.BookAppointment;

namespace HDMS_API.Application.Interfaces
{
    public interface IAppointmentRepository
    {
        Task<Appointment> CreateAppointmentAsync(BookAppointmentCommand request, int patientId);
        Task<List<AppointmentDTO>> GetAppointmentsByPatientIdAsync(int patientId);
        Task<List<AppointmentDTO>> GetAllAppointmentAsync();
        Task<AppointmentDTO> GetAppointmentByIdAsync(int appointmentId);
        Task<bool> CancelAppointmentAsync(int appId, int cancleBy);
        Task<bool> CheckAppointmentByPatientIdAsync(int appId, int userId);
        Task<bool> ExistsAppointmentAsync(int patientId, DateTime date);


    }
}
