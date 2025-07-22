
using Application.Interfaces;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Application.Constants;
using Domain.Entities;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Receptionist.CreateDiscountProgram
{
    public class CreateDiscountProgramHandler : IRequestHandler<CreateDiscountProgramCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPromotionrepository _promotionRepository;
        private readonly IProcedureRepository _procedureRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;


        public CreateDiscountProgramHandler(IHttpContextAccessor httpContextAccessor, IPromotionrepository promotionrepository, IProcedureRepository procedureRepository, IOwnerRepository ownerRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _promotionRepository = promotionrepository;
            _procedureRepository = procedureRepository;
            _ownerRepository = ownerRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(CreateDiscountProgramCommand request, CancellationToken cancellationToken)
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

            if (request.EndDate < request.CreateDate)
            {
                throw new Exception(MessageConstants.MSG.MSG34); // "Ngày kết thúc không được nhỏ hơn ngày tạo"
            }

            if (request.ListProcedure == null || request.ListProcedure.Count == 0)
            {
                throw new Exception(MessageConstants.MSG.MSG119);
            }

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

            bool isCreated;
            var discountProgram = new DiscountProgram
            {
                DiscountProgramName = request.ProgramName,
                CreateDate = request.CreateDate,
                EndDate = request.EndDate,
                CreateAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDelete = true // Mặc định là true, có thể thay đổi sau này
            };
             isCreated = await _promotionRepository.CreateDiscountProgramAsync(discountProgram);
            if (!isCreated) throw new Exception(MessageConstants.MSG.MSG116);

            foreach (var procedureDiscount in request.ListProcedure)
            {
                var procedureDiscountProgram = new ProcedureDiscountProgram
                {
                    DiscountProgramId = discountProgram.DiscountProgramID,
                    ProcedureId = procedureDiscount.ProcedureId,
                    DiscountAmount = procedureDiscount.DiscountAmount,
                };
                isCreated = await _promotionRepository.CreateProcedureDiscountProgramAsync(procedureDiscountProgram);
                if (!isCreated)
                {
                    throw new Exception(MessageConstants.MSG.MSG116);
                }
            }

            var owners = await _ownerRepository.GetAllOwnersAsync();
            try
            {
                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(new SendNotificationCommand(
                      o.User.UserID,
                      "Taọ chương trình khuyến mãi",
                      $"Lễ tân {o.User.Fullname} đã tạo chương trình khuyến mãi {request.ProgramName} vào lúc {DateTime.Now}",
                      null, null),
                cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return true;
        }
    }
}
