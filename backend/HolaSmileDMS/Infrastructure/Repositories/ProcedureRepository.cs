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

    public Task<Procedure?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return _context.Procedures.FirstOrDefaultAsync(x=> x.ProcedureId == id, ct);
    }
}