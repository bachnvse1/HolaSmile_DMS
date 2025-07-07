using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class SupplyRepository : ISupplyRepository
    {
        private readonly ApplicationDbContext _context;
        public SupplyRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CreateSupplyAsync(Supplies supply)
        {
            _context.Supplies.AddAsync(supply);
            await _context.SaveChangesAsync();
            return true; // Return true if creation is successful
        }

        public async Task<Supplies> GetSupplyBySupplyIdAsync(int supplyId)
        {
             var supply = await _context.Supplies.FirstOrDefaultAsync(s => s.SupplyId == supplyId);
            return supply; // Return true if creation is successful
        }
        public async Task<List<Supplies>> GetAllSuppliesAsync()
        {
            var supplies = await _context.Supplies.ToListAsync();
            return supplies; // Return true if creation is successful
        }

        public async Task<bool> EditSupplyAsync(Supplies supply)
        {
            _context.Supplies.Update(supply);
            await _context.SaveChangesAsync();
            return true; // Return true if creation is successful
        }
    }
}
