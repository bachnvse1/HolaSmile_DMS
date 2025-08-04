using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.ViewPromotionProgram
{
    public class ViewPromotionProgramHandler : IRequestHandler<ViewPromotionProgramCommand, List<DiscountProgram>>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPromotionRepository _promotionRepository;

        public ViewPromotionProgramHandler(IHttpContextAccessor httpContextAccessor, IPromotionRepository promotionrepository, IProcedureRepository procedureRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _promotionRepository = promotionrepository;
        }
        public async Task<List<DiscountProgram>> Handle(ViewPromotionProgramCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (string.Equals(currentUserRole, "administrator", StringComparison.OrdinalIgnoreCase) )
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            var promotionPrograms = await _promotionRepository.GetAllPromotionProgramsAsync();
            if (promotionPrograms == null || promotionPrograms.Count == 0)
            {
                promotionPrograms = new List<DiscountProgram>();
            }
            return promotionPrograms;
        }
    }
}
