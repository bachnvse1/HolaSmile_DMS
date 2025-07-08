using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ProcedureRepository : IProcedureRepository
{
    private readonly ApplicationDbContext _context;

    public ProcedureRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Procedure>> GetAll()
    {
        return await _context.Procedures
            .Include(p => p.SuppliesUsed)
            .ThenInclude(su => su.Supplies)
            .ToListAsync();
    }

    public async Task<Procedure?> GetProcedureByProcedureId(int procedureId)
    {
        var procedure = await _context.Procedures
                      .Include(p => p.SuppliesUsed)
                      .ThenInclude(su => su.Supplies)
                      .FirstOrDefaultAsync(p => p.ProcedureId == procedureId);
        return procedure;
    }

    public async Task<bool> CreateProcedure(Procedure procedure)
    {
        _context.Procedures.AddAsync(procedure);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UpdateProcedureAsync(Procedure procedure)
    {
        _context.Procedures.Update(procedure);
        return await _context.SaveChangesAsync() > 0;
    }

    public Task<Procedure?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return _context.Procedures.FirstOrDefaultAsync(x=> x.ProcedureId == id, ct);
    }

    public async Task<bool> CreateSupplyUsed(List<SuppliesUsed> suppliesUsed)
    {
        _context.SuppliesUseds.AddRange(suppliesUsed);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteSuppliesUsed(int procedureId)
    {
        var existing = await _context.SuppliesUseds
            .Where(su => su.ProcedureId == procedureId)
            .ToListAsync();

        if (!existing.Any()) return true;

        _context.SuppliesUseds.RemoveRange(existing);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<SuppliesUsed>> GetSuppliesUsedByProcedureId(int procedureId)
    {
        return await _context.SuppliesUseds
            .Where(su => su.ProcedureId == procedureId)
            .Include(su => su.Supplies)
            .ToListAsync();
    }
}