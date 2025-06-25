using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;

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
    }
}
