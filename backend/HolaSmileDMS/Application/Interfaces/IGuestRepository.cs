using HDMS_API.Application.Usecases.Guests.BookAppointment;

namespace HDMS_API.Application.Interfaces
{
    public interface IGuestRepository
    {
        Task<bool> CreateAppointmentAsync(Appointment);
        Task<IEnumerable<Schedule>> GetAvailableSlotsAsync(DateOnly date, int doctorId);
    }
}
