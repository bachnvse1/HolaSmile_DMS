using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;

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
}