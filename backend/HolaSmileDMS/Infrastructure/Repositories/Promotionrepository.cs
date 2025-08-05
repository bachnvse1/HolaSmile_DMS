using Application.Interfaces;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class PromotionRepository : IPromotionRepository
    {
        private readonly ApplicationDbContext _context;

        public PromotionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<DiscountProgram>> GetAllPromotionProgramsAsync()
        {
            return await _context.DiscountPrograms.ToListAsync();
        }

        public async Task<bool> CreateDiscountProgramAsync(DiscountProgram discountProgram)
        {
            _context.DiscountPrograms.Add(discountProgram);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> CreateProcedureDiscountProgramAsync(ProcedureDiscountProgram procedureDiscountProgram)
        {
            _context.ProcedureDiscountPrograms.Add(procedureDiscountProgram);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteProcedureDiscountsByProgramIdAsync(int discountProgramId)
        {
            var items = await _context.ProcedureDiscountPrograms
        .Where(p => p.DiscountProgramId == discountProgramId)
        .ToListAsync();

            _context.ProcedureDiscountPrograms.RemoveRange(items);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<DiscountProgram> GetDiscountProgramByIdAsync(int id)
        {
            var discountProgram = await _context.DiscountPrograms
                .Include(dp => dp.ProcedureDiscountPrograms)
                .ThenInclude(pd => pd.Procedure)
                .FirstOrDefaultAsync(dp => dp.DiscountProgramID == id);
            return discountProgram;
        }

        public async Task<DiscountProgram> GetProgramActiveAsync()
        {

            return await _context.DiscountPrograms.FirstOrDefaultAsync(p => !p.IsDelete);
        }

        public async Task<bool> UpdateDiscountProgramAsync(DiscountProgram discountProgram)
        {
            _context.DiscountPrograms.Update(discountProgram);
            return await _context.SaveChangesAsync() > 0;
        }
        
    }
}
