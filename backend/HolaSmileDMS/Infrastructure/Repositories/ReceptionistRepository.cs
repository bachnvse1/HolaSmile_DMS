using Application.Interfaces;
using Application.Usecases.Dentist.ViewListReceptionistName;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ReceptionistRepository : IReceptionistRepository
{
    private readonly ApplicationDbContext _context;
    public ReceptionistRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<List<ReceptionistRecordDto>> GetAllReceptionistsNameAsync(CancellationToken cancellationToken)
    {
        return await _context.Receptionists
            .Include(r => r.User)
            .Where(r => r.User != null && r.User.Status == true)
            .Select(r => new ReceptionistRecordDto
            {
                ReceptionistId = r.ReceptionistId,
                FullName = r.User.Fullname
            })
            .ToListAsync(cancellationToken);
    }
}