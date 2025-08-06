
using Domain.Entities;

namespace Application.Interfaces
{
    public interface IPromotionRepository
    {
        Task<List<DiscountProgram>> GetAllPromotionProgramsAsync();
         Task<bool> CreateDiscountProgramAsync(DiscountProgram discountProgram);
         Task<bool> CreateProcedureDiscountProgramAsync(ProcedureDiscountProgram procedureDiscountProgram);
         Task<bool> UpdateDiscountProgramAsync(DiscountProgram discountProgram);
         Task<bool> DeleteProcedureDiscountsByProgramIdAsync(int discountProgramId);
        Task<DiscountProgram> GetProgramActiveAsync();
         Task<DiscountProgram> GetDiscountProgramByIdAsync(int id);
    }
}
