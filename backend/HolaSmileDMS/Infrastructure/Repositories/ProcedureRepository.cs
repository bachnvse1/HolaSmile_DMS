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
        return await _context.Procedures.ToListAsync();
    }

    public async Task<Procedure> GetProcedureByProcedureId(int procedureId)
    {
        var procedure = await _context.Procedures.FindAsync(procedureId);
        return procedure;
    }

    public async Task<bool> CreateProcedure(Procedure procedure)
    {
        _context.Procedures.AddAsync(procedure);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UpdateProcedureAsync(Procedure procedure)
    {
        var existingProcedure = await _context.Procedures.FindAsync(procedure.ProcedureId);
        _context.Procedures.Update(procedure);
        return await _context.SaveChangesAsync() > 0;
    }
}