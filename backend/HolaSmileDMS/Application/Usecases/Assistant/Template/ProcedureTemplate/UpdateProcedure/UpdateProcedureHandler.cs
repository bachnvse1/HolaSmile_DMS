using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.Template.ProcedureTemplate.UpdateProcedure
{
    public class UpdateProcedureHandler : IRequestHandler<UpdateProcedureCommand, bool>
    {
        private readonly IProcedureRepository _procedureRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public UpdateProcedureHandler(IProcedureRepository procedureRepository, IHttpContextAccessor httpContextAccessor)
        {
            _procedureRepository = procedureRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> Handle(UpdateProcedureCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."

            var currentUserRole = user.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");


            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            var procedure = await _procedureRepository.GetProcedureByProcedureId(request.ProcedureId);
            if (procedure == null)
            {
                throw new Exception(MessageConstants.MSG.MSG16); // "Không tìm thấy thủ thuật"
            }
            if (string.IsNullOrEmpty(request.ProcedureName))
            {
                throw new Exception(MessageConstants.MSG.MSG07);
            }
            if (request.Price <= 0)
            {
                throw new Exception(MessageConstants.MSG.MSG95);
            }
            if (request.Discount < 0)
            {
                throw new Exception(MessageConstants.MSG.MSG95);
            }
            if (request.OriginalPrice <= 0)
            {
                throw new Exception(MessageConstants.MSG.MSG95);
            }
            if (request.ConsumableCost < 0)
            {
                throw new Exception(MessageConstants.MSG.MSG95);
            }
            if (request.ReferralCommissionRate < 0)
            {
                throw new Exception(MessageConstants.MSG.MSG95);
            }
            if (request.DoctorCommissionRate < 0)
            {
                throw new Exception(MessageConstants.MSG.MSG95);
            }
            if (request.AssistantCommissionRate < 0)
            {
                throw new Exception(MessageConstants.MSG.MSG95);
            }
            if (request.TechnicianCommissionRate < 0)
            {
                throw new Exception(MessageConstants.MSG.MSG95);
            }

            procedure.ProcedureName = request.ProcedureName;
            procedure.Price = Math.Round(request.Price);
            procedure.Description = request.Description;
            procedure.Discount = request.Discount;
            procedure.WarrantyPeriod = request.WarrantyPeriod;
            procedure.OriginalPrice = Math.Round(request.OriginalPrice,2);
            procedure.ConsumableCost = Math.Round(request.ConsumableCost,2);
            procedure.ReferralCommissionRate = request.ReferralCommissionRate;
            procedure.DoctorCommissionRate = request.DoctorCommissionRate;
            procedure.AssistantCommissionRate = request.AssistantCommissionRate;
            procedure.TechnicianCommissionRate = request.TechnicianCommissionRate;
            procedure.UpdatedAt = DateTime.UtcNow;
            procedure.UpdatedBy = currentUserId;
            return await _procedureRepository.UpdateProcedureAsync(procedure);
        }
    }
}
