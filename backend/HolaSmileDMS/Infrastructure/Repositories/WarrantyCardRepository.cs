using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class WarrantyCardRepository : IWarrantyCardRepository
    {
        private readonly ApplicationDbContext _context;

        public WarrantyCardRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<WarrantyCard>> GetAllWarrantyCardsWithProceduresAsync(
            CancellationToken cancellationToken)
        {
            return await _context.WarrantyCards
                .Include(w => w.TreatmentRecord)
                .ThenInclude(tr => tr.Procedure)
                .Include(w => w.TreatmentRecord)
                .ThenInclude(tr => tr.Appointment)
                .ThenInclude(a => a.Patient)
                    .ThenInclude(p => p.User)
                .ToListAsync(cancellationToken);
        }

        public async Task<WarrantyCard?> GetByIdAsync(int id, CancellationToken ct)
        {
            return await _context.WarrantyCards
                .Include(w => w.TreatmentRecord)
                .FirstOrDefaultAsync(w => w.WarrantyCardID == id, ct);
        }

        public async Task<bool> DeactiveWarrantyCardAsync(WarrantyCard card, CancellationToken ct)
        {
            _context.WarrantyCards.Update(card);
            var result = await _context.SaveChangesAsync(ct);
            return result > 0;
        }

        public async Task<List<WarrantyCard>> GetAllAsync(CancellationToken ct)
        {
            return await _context.WarrantyCards
                .Include(w => w.TreatmentRecord)
                .OrderByDescending(w => w.StartDate)
                .ToListAsync(ct);
        }

        public async Task<WarrantyCard> CreateWarrantyCardAsync(WarrantyCard card, CancellationToken cancellationToken)
        {
            await _context.WarrantyCards.AddAsync(card, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return card;
        }


        public async Task<bool> UpdateWarrantyCardAsync(WarrantyCard card, CancellationToken cancellationToken)
        {
            _context.WarrantyCards.Update(card);
            var result = await _context.SaveChangesAsync(cancellationToken);
            return result > 0;
        }
    }
}