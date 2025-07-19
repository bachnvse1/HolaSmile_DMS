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
        private readonly IPromotionrepository _promotionRepository;
        private readonly IProcedureRepository _procedureRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;

        public DeactivePromotionHandler(IHttpContextAccessor httpContextAccessor, IPromotionrepository promotionRepository, IProcedureRepository procedureRepository, IOwnerRepository ownerRepository, IMediator mediator)
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
                throw new Exception(MessageConstants.MSG.MSG119);

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
                        $" chương trình khuyến mãi {discountProgram.DiscountProgramName} đã kết thúc vào lúc {DateTime.Now}",
                      null, null),
                     cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return result;
        }
    }
}
