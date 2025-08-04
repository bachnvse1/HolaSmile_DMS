using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.ViewPromotionProgram
{
        public class ViewDetailPromotionProgramHandler : IRequestHandler<ViewDetailPromotionProgramCommand, ViewPromotionResponse>
        {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPromotionRepository _promotionRepository;
        private readonly IProcedureRepository _procedureRepository;
        private readonly IUserCommonRepository _userCommonRepository;


        public ViewDetailPromotionProgramHandler(IHttpContextAccessor httpContextAccessor, IPromotionRepository promotionrepository, IProcedureRepository procedureRepository, IUserCommonRepository userCommonRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _promotionRepository = promotionrepository;
            _procedureRepository = procedureRepository;
            _userCommonRepository = userCommonRepository;
        }
        public async Task<ViewPromotionResponse> Handle(ViewDetailPromotionProgramCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (string.Equals(currentUserRole, "administrator", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }
            var discountProgram = await _promotionRepository.GetDiscountProgramByIdAsync(request.DiscountProgramId);
            if (discountProgram == null)
            {
                throw new Exception(MessageConstants.MSG.MSG119);
            }

            var createdByUser = await _userCommonRepository.GetByIdAsync(discountProgram.CreatedBy, cancellationToken);
            var updatedByUser = discountProgram.UpdatedBy.HasValue
                ? await _userCommonRepository.GetByIdAsync(discountProgram.UpdatedBy.Value, cancellationToken)
                : null;
            if (createdByUser == null)
            {
                throw new Exception(MessageConstants.MSG.MSG16);
            }

            var result = new ViewPromotionResponse
            {
                ProgramId = discountProgram.DiscountProgramID,
                ProgramName = discountProgram.DiscountProgramName,
                StartDate = discountProgram.CreateDate,
                EndDate = discountProgram.EndDate,
                CreateAt = discountProgram.CreateAt,
                UpdateAt = discountProgram.UpdatedAt,
                CreateBy = createdByUser?.Fullname ?? "",
                UpdateBy = updatedByUser?.Fullname ?? "",
                IsDelete = discountProgram.IsDelete,
                ListProcedure = discountProgram.ProcedureDiscountPrograms.Select(p => new ViewProcedurePromotionRespose
                {
                    ProcedureId = p.ProcedureId,
                    ProcedureName = p.Procedure?.ProcedureName??"",
                    DiscountAmount = p.DiscountAmount
                }).ToList()
            };
            return result;
        }
    }
}
