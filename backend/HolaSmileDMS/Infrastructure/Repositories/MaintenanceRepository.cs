using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class MaintenanceRepository : IMaintenanceRepository
    {
        private readonly ApplicationDbContext _context;

        public MaintenanceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CreateMaintenanceAsync(EquipmentMaintenance maintenance)
        {
            await _context.EquipmentMaintenances.AddAsync(maintenance);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddMaintenanceSupplyAsync(MaintenanceSupply supply)
        {
            await _context.MaintenanceSupplies.AddAsync(supply);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<int>> GetAllValidSupplyIdsAsync()
        {
            return await _context.Supplies
                .Where(s => !s.IsDeleted)
                .Select(s => s.SupplyId)
                .ToListAsync();
        }
        public async Task<bool> CreateMaintenanceSupplyAsync(MaintenanceSupply maintenanceSupply)
        {
            await _context.MaintenanceSupplies.AddAsync(maintenanceSupply);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<List<EquipmentMaintenance>> GetAllMaintenancesWithSuppliesAsync()
        {
            return await _context.EquipmentMaintenances
                .Include(m => m.MaintenanceSupplies)
                    .ThenInclude(ms => ms.Supplies)
                .Where(m => !m.IsDeleted)
                .OrderByDescending(m => m.MaintenanceDate)
                .ToListAsync();
        }
        public async Task<EquipmentMaintenance?> GetMaintenanceByIdWithSuppliesAsync(int maintenanceId)
        {
            return await _context.EquipmentMaintenances
                .Include(m => m.MaintenanceSupplies)
                    .ThenInclude(ms => ms.Supplies)
                .FirstOrDefaultAsync(m => m.MaintenanceId == maintenanceId && !m.IsDeleted);
        }

        public async Task<EquipmentMaintenance?> GetMaintenanceByIdAsync(int id)
        {
            return await _context.EquipmentMaintenances.FindAsync(id);
        }

        public async Task<bool> UpdateMaintenanceAsync(EquipmentMaintenance maintenance)
        {
            _context.EquipmentMaintenances.Update(maintenance);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
