using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class WarrantyCardRepository : IWarrantyRepository
    {
        private readonly ApplicationDbContext _context;

        public WarrantyCardRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<WarrantyCard>> GetAllWarrantyCardsWithProceduresAsync(CancellationToken cancellationToken)
        {
            return await _context.WarrantyCards
                .Include(w => w.Procedures)
                .ToListAsync(cancellationToken);
        }
        public async Task<WarrantyCard> CreateWarrantyCardAsync(WarrantyCard card, CancellationToken cancellationToken)
        {
            _context.WarrantyCards.Add(card);
            await _context.SaveChangesAsync(cancellationToken);
            return card;
        }


    }
}
