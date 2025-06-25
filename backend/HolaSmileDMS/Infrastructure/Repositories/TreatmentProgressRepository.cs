using Application.Constants.Interfaces;
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
            .Include(tp => tp.Dentist).ThenInclude(d => d.User) 
            .Include(tp => tp.Patient).ThenInclude(p  => p .User) 
            .Where(tp => tp.TreatmentRecordID == treatmentRecordId)
            .ToListAsync(cancellationToken);
    }
    public async System.Threading.Tasks.Task CreateAsync(TreatmentProgress progress)
    {
        _context.TreatmentProgresses.Add(progress);
        await _context.SaveChangesAsync();
    }
}