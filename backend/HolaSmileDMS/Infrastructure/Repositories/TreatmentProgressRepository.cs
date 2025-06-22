using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
namespace Infrastructure.Repositories;

public class TreatmentProgressRepository : ITreatmentProgressRepository
{
    private readonly ApplicationDbContext _context;

    public TreatmentProgressRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TreatmentProgress>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken cancellationToken)
    {
        return await _context.TreatmentProgresses
            .Include(tp => tp.Dentist)
            .Include(tp => tp.Patient)
            .Where(tp => tp.TreatmentRecordID == treatmentRecordId)
            .ToListAsync(cancellationToken);
    }
}