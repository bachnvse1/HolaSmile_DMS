using Application.Interfaces;
using Application.Usecases.Guests.ViewAllGuestCommand;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Infrastructure.Repositories
{
    public class GuestRepository : IGuestRepository
    {
        private readonly ApplicationDbContext _context;
        public GuestRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Schedule>> GetAvailableSlotsAsync(DateOnly date, int doctorId)
        {
            throw new NotImplementedException();
        }

        public async Task<List<GuestChatDto>> GetAllGuestsAsync()
        {
            return await _context.GuestInfos
                .OrderByDescending(g => g.LastMessageAt)
                .Select(g => new GuestChatDto
                {
                    GuestId = g.GuestId,
                    Name = g.Name,
                    PhoneNumber = g.PhoneNumber,
                    Email = g.Email,
                    LastMessageAt = g.LastMessageAt,
                    Status = g.Status
                })
                .ToListAsync();
        }
    }
}
