using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Application.Usecases.SendNotification;
using Domain.Entities;

namespace Application.Usecases.Receptionist.UpdateDiscountProgram
{
    public class UpdateDiscountProgramHandler : IRequestHandler<UpdateDiscountProgramCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPromotionRepository _promotionRepository;
        private readonly IProcedureRepository _procedureRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;

        public UpdateDiscountProgramHandler(IHttpContextAccessor httpContextAccessor, IPromotionRepository promotionRepository, IProcedureRepository procedureRepository, IOwnerRepository ownerRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _promotionRepository = promotionRepository;
            _procedureRepository = procedureRepository;
            _ownerRepository = ownerRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(UpdateDiscountProgramCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            if (string.IsNullOrWhiteSpace(request.ProgramName.Trim()))
            {
                throw new Exception(MessageConstants.MSG.MSG07); // "Vui lòng nhập thông tin bắt buộc"
            }

            if (request.EndDate < request.StartDate)
            {
                throw new Exception(MessageConstants.MSG.MSG34); // "Ngày kết thúc không được nhỏ hơn ngày tạo"
            }

            if (request.ListProcedure == null || request.ListProcedure.Count == 0)
            {
                throw new Exception(MessageConstants.MSG.MSG118);
            }

            var discountProgram = await _promotionRepository.GetDiscountProgramByIdAsync(request.ProgramId);
            if (discountProgram == null)
                throw new Exception(MessageConstants.MSG.MSG119);

            var validProcedureIds = await _procedureRepository.GetAllProceddureIdAsync();
            foreach (var procedure in request.ListProcedure)
            {
                if (!validProcedureIds.Contains(procedure.ProcedureId))
                    throw new Exception(MessageConstants.MSG.MSG99);
                if (procedure.DiscountAmount < 0 || procedure.DiscountAmount > 100)
                {
                    throw new Exception(MessageConstants.MSG.MSG125);
                }
            }

            discountProgram.DiscountProgramName = request.ProgramName;
            discountProgram.CreateDate = request.StartDate;
            discountProgram.EndDate = request.EndDate;
            discountProgram.UpdatedAt = DateTime.Now;
            discountProgram.UpdatedBy = currentUserId;

            var isUpdated = await _promotionRepository.UpdateDiscountProgramAsync(discountProgram);
            if (!isUpdated)
                throw new Exception(MessageConstants.MSG.MSG58);

            // Xoá danh sách cũ
            await _promotionRepository.DeleteProcedureDiscountsByProgramIdAsync(request.ProgramId);

            // Thêm lại mới
            foreach (var p in request.ListProcedure)
            {
                var entry = new ProcedureDiscountProgram
                {
                    DiscountProgramId = request.ProgramId,
                    ProcedureId = p.ProcedureId,
                    DiscountAmount = p.DiscountAmount
                };
                var added = await _promotionRepository.CreateProcedureDiscountProgramAsync(entry);
                if (!added)
                    throw new Exception(MessageConstants.MSG.MSG58);
            }

            // Gửi thông báo cho Owner
            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();

                var notifyOwners = owners.Select(async o =>
                     await _mediator.Send(new SendNotificationCommand(
                     o.User.UserID,
                      "Cập nhật chương trình khuyến mãi",
                        $"Lễ tân {o.User.Fullname} đã cập nhật chương trình khuyến mãi {request.ProgramName} vào lúc {DateTime.Now}",
                      "promotions", 0, $"promotions/{discountProgram.DiscountProgramID}"),
                     cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return true;
        }
    }
}
