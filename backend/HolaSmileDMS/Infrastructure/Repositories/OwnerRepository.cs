using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class OwnerRepository : IOwnerRepository
    {
        private readonly ApplicationDbContext _context;
        public OwnerRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<List<Owner>> GetAllOwnersAsync()
        {
            return await _context.Owners.Include(o => o.User).ToListAsync();
        }

        public async Task<Owner> GetOwnerByUserIdAsync(int? userId)
        {
            return await _context.Owners.Include(o => o.User).FirstOrDefaultAsync(o => o.User.UserID == userId);
        }
    }
}
