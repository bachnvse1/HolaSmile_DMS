using Application.Usecases.Guests.ViewAllGuestCommand;
using HDMS_API.Application.Usecases.Guests.BookAppointment;

namespace Application.Interfaces
{
    public interface IGuestRepository
    {
        Task<IEnumerable<Schedule>> GetAvailableSlotsAsync(DateOnly date, int doctorId);
        Task<List<GuestChatDto>> GetAllGuestsAsync();
    }
}
