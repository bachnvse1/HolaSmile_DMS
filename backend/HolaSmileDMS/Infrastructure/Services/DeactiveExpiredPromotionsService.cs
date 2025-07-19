using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Interfaces;
using Application.Services;

namespace Infrastructure.Services
{
    public class DeactiveExpiredPromotionsService : IDeactiveExpiredPromotionsService
    {
        private readonly IPromotionrepository _promotionRepository;
        public DeactiveExpiredPromotionsService(IPromotionrepository promotionRepository)
        {
            _promotionRepository = promotionRepository;
        }
        public async Task<bool> DeactiveExpiredPromotionsAsync()
        {
            var expiredPromotions = await _promotionRepository.GetProgramActiveAsync();
            if (expiredPromotions == null || expiredPromotions.EndDate > DateTime.Now)
            {
                return false; // Không có chương trình khuyến mãi nào đã hết hạn
            }
                expiredPromotions.IsDelete = true;
                expiredPromotions.UpdatedAt = DateTime.Now;
                await _promotionRepository.UpdateDiscountProgramAsync(expiredPromotions);
            return true;
        }
    }

}
