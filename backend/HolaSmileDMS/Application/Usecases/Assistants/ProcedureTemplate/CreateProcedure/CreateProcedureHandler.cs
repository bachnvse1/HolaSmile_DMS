using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure
{
    public class CreateProcedureHandler : IRequestHandler<CreateProcedureCommand, bool>
    {
        private readonly IProcedureRepository _procedureRepository;
        private readonly ISupplyRepository _supplyRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CreateProcedureHandler(IProcedureRepository procedureRepository, ISupplyRepository supplyRepository, IHttpContextAccessor httpContextAccessor)
        {
            _procedureRepository = procedureRepository;
            _supplyRepository = supplyRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<bool> Handle(CreateProcedureCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."
            }

            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase)){
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            if (string.IsNullOrEmpty(request.ProcedureName))
                throw new Exception(MessageConstants.MSG.MSG07);
            if (request.Price <= 0 || request.OriginalPrice <= 0)
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
                WarrantyPeriod = request.WarrantyPeriod,
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
            return await _procedureRepository.CreateProcedure(procedure);
        }
    }
}
