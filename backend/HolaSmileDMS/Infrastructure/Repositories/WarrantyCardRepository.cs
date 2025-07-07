using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class WarrantyCardRepository : IWarrantyCardRepository
{
    private readonly ApplicationDbContext _context;

    public WarrantyCardRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<WarrantyCard?> GetByIdAsync(int warrantyCardId, CancellationToken ct = default)
    {
        return await _context.WarrantyCards
            .FirstOrDefaultAsync(wc => wc.WarrantyCardID == warrantyCardId, ct);
    }
}