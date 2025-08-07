using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure
{
    public class CreateProcedureHandler : IRequestHandler<CreateProcedureCommand, bool>
    {
        private readonly IProcedureRepository _procedureRepository;
        private readonly ISupplyRepository _supplyRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;
        public CreateProcedureHandler(IProcedureRepository procedureRepository, ISupplyRepository supplyRepository, IOwnerRepository ownerRepository, IUserCommonRepository userCommonRepository, IHttpContextAccessor httpContextAccessor, IMediator mediator)
        {
            _procedureRepository = procedureRepository;
            _supplyRepository = supplyRepository;
            _ownerRepository = ownerRepository;
            _httpContextAccessor = httpContextAccessor;
            _userCommonRepository = userCommonRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(CreateProcedureCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            if (string.IsNullOrEmpty(request.ProcedureName))
                throw new Exception(MessageConstants.MSG.MSG07);
            if ( request.OriginalPrice <= 0)
                throw new Exception(MessageConstants.MSG.MSG95);
            if (request.Discount < 0 || request.Discount > 100 || request.ConsumableCost < 0 || request.ReferralCommissionRate < 0 ||
                request.DoctorCommissionRate < 0 || request.AssistantCommissionRate < 0 || request.TechnicianCommissionRate < 0)
                throw new Exception(MessageConstants.MSG.MSG125);

            decimal supplyCost = 0;
            var suppliesUsed = new List<SuppliesUsed>();
            if (request.SuppliesUsed != null)
            {
                foreach (var item in request.SuppliesUsed)
                {
                    var supply = await _supplyRepository.GetSupplyBySupplyIdAsync(item.SupplyId);
                    if (supply == null)
                        throw new Exception($"Supply với ID {item.SupplyId} không tồn tại.");

                    if (supply.Unit?.Trim().ToLower() == "cái")
                    {
                        supplyCost += supply.Price * item.Quantity;
                    }

                    suppliesUsed.Add(new SuppliesUsed
                    {
                        SupplyId = item.SupplyId,
                        Quantity = item.Quantity
                    });
                }
            }

            decimal consumableTotal = Math.Round(request.ConsumableCost + supplyCost, 2);
            decimal priceTotal = Math.Round(request.OriginalPrice + consumableTotal, 0);


            var procedure = new Procedure
            {
                ProcedureName = request.ProcedureName,
                Description = request.Description,
                Discount = request.Discount,
                OriginalPrice = Math.Round(request.OriginalPrice, 2),
                ConsumableCost = consumableTotal,
                Price = priceTotal,
                ReferralCommissionRate = request.ReferralCommissionRate,
                DoctorCommissionRate = request.DoctorCommissionRate,
                AssistantCommissionRate = request.AssistantCommissionRate,
                TechnicianCommissionRate = request.TechnicianCommissionRate,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = currentUserId,
                SuppliesUsed = suppliesUsed
            };

            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();
                var assistant = await _userCommonRepository.GetByIdAsync(currentUserId, cancellationToken);

                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(new SendNotificationCommand(
                      o.User.UserID,
                      "Tạo thủ thuật mới",
                      $"Trợ lý {assistant.Fullname} tạo thủ thuật mới {procedure.ProcedureName} vào lúc {DateTime.Now}",
                      "procedure", 0, $"proceduces"),
                cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return await _procedureRepository.CreateProcedure(procedure);
        }
    }
}
