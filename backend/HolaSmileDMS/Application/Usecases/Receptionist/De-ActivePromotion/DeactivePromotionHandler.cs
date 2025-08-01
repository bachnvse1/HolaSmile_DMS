using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Receptionist.De_ActivePromotion
{
    public class DeactivePromotionHandler : IRequestHandler<DeactivePromotionCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPromotionRepository _promotionRepository;
        private readonly IProcedureRepository _procedureRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;

        public DeactivePromotionHandler(IHttpContextAccessor httpContextAccessor, IPromotionRepository promotionRepository, IProcedureRepository procedureRepository, IOwnerRepository ownerRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _promotionRepository = promotionRepository;
            _procedureRepository = procedureRepository;
            _ownerRepository = ownerRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(DeactivePromotionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            var discountProgram = await _promotionRepository.GetDiscountProgramByIdAsync(request.ProgramId);
            if (discountProgram == null)
                throw new Exception(MessageConstants.MSG.MSG119); // "Không tìm thấy chương trình khuyến mãi"

            if (!discountProgram.IsDelete)
            {
                // Đang k bi xoa(active) → sắp unactive

                // Restore giá gốc từ giá đã giảm (nếu bạn không lưu OriginalPrice)
                foreach (var pd in discountProgram.ProcedureDiscountPrograms)
                {
                    var proc = await _procedureRepository.GetProcedureByIdAsync(pd.ProcedureId, cancellationToken);
                    proc.Price = proc.Price / (1 - (pd.DiscountAmount / 100m)); // phục hồi
                    var ok = await _procedureRepository.UpdateProcedureAsync(proc, cancellationToken);
                    if (!ok) throw new Exception(MessageConstants.MSG.MSG58);
                }
            }
            else
            {
                if (discountProgram.CreateAt.Date != DateTime.Now.Date) throw new Exception("Ngày bắt đầu chương trình không khớp với hôm nay");

                // bị xóa(khong active)  → sắp activate => áp dụng giảm giá
                var activeProgram = await _promotionRepository.GetProgramActiveAsync();

                if (activeProgram != null && activeProgram.DiscountProgramID != discountProgram.DiscountProgramID)
                    throw new Exception(MessageConstants.MSG.MSG121); // "Chỉ được phép có 1 chương trình khuyến mãi tại 1 thời điểm"

                if (discountProgram.EndDate <= DateTime.Now || discountProgram.CreateDate.Date < DateTime.Now.Date) throw new Exception(MessageConstants.MSG.MSG126);

                foreach (var pd in discountProgram.ProcedureDiscountPrograms)
                {
                    var proc = await _procedureRepository.GetProcedureByIdAsync(pd.ProcedureId, cancellationToken);
                    proc.Price = proc.Price * (1 - (pd.DiscountAmount / 100m));
                    var ok = await _procedureRepository.UpdateProcedureAsync(proc, cancellationToken);
                    if (!ok) throw new Exception(MessageConstants.MSG.MSG58);
                }
            }

            discountProgram.IsDelete = !discountProgram.IsDelete;
            discountProgram.UpdatedAt = DateTime.Now;
            discountProgram.UpdatedBy = currentUserId;
            var result = await _promotionRepository.UpdateDiscountProgramAsync(discountProgram);
            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();

                var notifyOwners = owners.Select(async o =>
                     await _mediator.Send(new SendNotificationCommand(
                     o.User.UserID,
                      "Cập nhật chương trình khuyến mãi",
                        $" chương trình khuyến mãi {discountProgram.DiscountProgramName} đã {(discountProgram.IsDelete ? "kết thúc" : "áp dụng")} vào lúc {DateTime.Now}",
                      "promotion", 0, $"promotions/{discountProgram.DiscountProgramID}"),
                     cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return result;
        }
    }
}
