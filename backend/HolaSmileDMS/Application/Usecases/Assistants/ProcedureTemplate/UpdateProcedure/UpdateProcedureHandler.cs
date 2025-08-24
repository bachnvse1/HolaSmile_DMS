using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.ProcedureTemplate.UpdateProcedure
{
    public class UpdateProcedureHandler : IRequestHandler<UpdateProcedureCommand, bool>
    {
        private readonly IProcedureRepository _procedureRepository;
        private readonly ISupplyRepository _supplyRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;
        public UpdateProcedureHandler(IProcedureRepository procedureRepository, ISupplyRepository supplyRepository, IOwnerRepository ownerRepository, IHttpContextAccessor httpContextAccessor, IMediator mediator)
        {
            _procedureRepository = procedureRepository;
            _supplyRepository = supplyRepository;
            _ownerRepository = ownerRepository;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;
        }

        public async Task<bool> Handle(UpdateProcedureCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            var procedure = await _procedureRepository.GetProcedureByProcedureId(request.ProcedureId) ?? throw new Exception(MessageConstants.MSG.MSG16);

            if (string.IsNullOrEmpty(request.ProcedureName))
                throw new Exception(MessageConstants.MSG.MSG07);
            if (request.Price <= 0 || request.OriginalPrice <= 0)
                throw new Exception(MessageConstants.MSG.MSG95);

            decimal supplyCost = 0;
            var existSuppliesUsed = new List<SuppliesUsed>();
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

                    existSuppliesUsed.Add(new SuppliesUsed
                    {
                        SupplyId = item.SupplyId,
                        Quantity = item.Quantity
                    });
                }
            }

            decimal consumableTotal = Math.Round(request.ConsumableCost + supplyCost, 2);
            decimal priceTotal = Math.Round(request.OriginalPrice + consumableTotal, 0);

            procedure.ProcedureName = request.ProcedureName;
            procedure.Price = priceTotal;
            procedure.Description = request.Description;
            procedure.Discount = request.Discount;
            procedure.OriginalPrice = Math.Round(request.OriginalPrice,2);
            procedure.ConsumableCost = consumableTotal;
            procedure.ReferralCommissionRate = request.ReferralCommissionRate;
            procedure.DoctorCommissionRate = request.DoctorCommissionRate;
            procedure.AssistantCommissionRate = request.AssistantCommissionRate;
            procedure.TechnicianCommissionRate = request.TechnicianCommissionRate;
            procedure.UpdatedAt = DateTime.UtcNow;
            procedure.UpdatedBy = currentUserId;

            var isDeletedSuppliesUsed = await _procedureRepository.DeleteSuppliesUsed(request.ProcedureId);
            if (!isDeletedSuppliesUsed)
            {
                throw new Exception(MessageConstants.MSG.MSG58);
            }

            var suppliesUsed = request.SuppliesUsed.Select(s => new SuppliesUsed
            {
                SupplyId = s.SupplyId,
                Quantity = s.Quantity,
                ProcedureId = request.ProcedureId
            }).ToList();

            if (suppliesUsed.Count > 0)
            {
                var isCreatedSuppliesUsed = await _procedureRepository.CreateSupplyUsed(suppliesUsed);
                if (!isCreatedSuppliesUsed)
                {
                    throw new Exception(MessageConstants.MSG.MSG58);
                }
            }

            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();
                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(new SendNotificationCommand(
                      o.User.UserID,
                      "Tạo thủ thuật mới",
                      $"Trợ lý {o.User.Fullname} thay đổi thông tin {procedure.ProcedureName} vào lúc {DateTime.Now}",
                      "procedure", 0, $"proceduces"),
                cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return await _procedureRepository.UpdateProcedureAsync(procedure);
        }
    }
}
