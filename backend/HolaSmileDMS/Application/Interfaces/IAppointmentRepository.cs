using Application.Usecases.UserCommon.Appointment;
using HDMS_API.Application.Usecases.Guests.BookAppointment;

namespace HDMS_API.Application.Interfaces
{
    public interface IAppointmentRepository
    {
        Task<Appointment> CreateAppointmentAsync(BookAppointmentCommand request, int patientId);
        Task<bool> CancleAppointmentAsync(Appointment appointment);
        Task<List<AppointmentDTO>> GetAllAppointmentAsync();
        Task<Appointment> GetAppointmentByIdsAsync(int appointmentId);
        Task<List<Appointment>> GetAppointmentsByPatientIdAsync(int patientId);
    }
}
