using HDMS_API.Application.Usecases.Guests.BookAppointment;

namespace Application.Constants.Interfaces
{
    public interface IGuestRepository
    {
        Task<Appointment> CreateAppointmentAsync(BookAppointmentCommand request, int patientId);
        Task<IEnumerable<Schedule>> GetAvailableSlotsAsync(DateOnly date, int doctorId);
    }
}
