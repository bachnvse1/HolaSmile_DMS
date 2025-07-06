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

    public IQueryable<Procedure> GetAll()
    {
        return _context.Procedures.AsQueryable();
    }
    public async Task<Procedure?> GetProcedureByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Procedures
            .FirstOrDefaultAsync(p => p.ProcedureId == id && !p.IsDeleted, cancellationToken);
    }

    public async Task<bool> UpdateProcedureAsync(Procedure procedure, CancellationToken cancellationToken)
    {
        _context.Procedures.Update(procedure);
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }
}