using HDMS_API.Application.Usecases.Guests.BookAppointment;

namespace HDMS_API.Application.Interfaces
{
    public interface IAppointmentRepository
    {
        Task<Appointment> CreateAppointmentAsync(BookAppointmentCommand request, int? patientId);
        Task<List<Appointment>> GetAllAppointmentAsync();
        Task<List<Appointment>> GetAppointmentsByPatientIdAsync(int patientId);
    }
}
