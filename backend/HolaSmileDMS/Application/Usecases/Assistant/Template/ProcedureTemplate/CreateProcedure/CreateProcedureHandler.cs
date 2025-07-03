using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.Template.ProcedureTemplate.CreateProcedure
{
    public class CreateProcedureHandler : IRequestHandler<CreateProcedureCommand, bool>
    {
        private readonly IProcedureRepository _procedureRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CreateProcedureHandler(IProcedureRepository procedureRepository, IHttpContextAccessor httpContextAccessor)
        {
            _procedureRepository = procedureRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<bool> Handle(CreateProcedureCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."

            var currentUserRole = user.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");


            if(!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase)){
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            if (string.IsNullOrEmpty(request.ProcedureName))
            {
                throw new Exception(MessageConstants.MSG.MSG07);
            }
            if(request.Price <=0)
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

            var procedure = new Procedure
            {
                ProcedureName = request.ProcedureName,
                Price = Math.Round(request.Price),
                Description = request.Description,
                Discount = request.Discount,
                WarrantyPeriod = request.WarrantyPeriod,
                OriginalPrice = Math.Round(request.OriginalPrice),
                ConsumableCost = Math.Round(request.ConsumableCost),
                ReferralCommissionRate = request.ReferralCommissionRate,
                DoctorCommissionRate = request.DoctorCommissionRate,
                AssistantCommissionRate = request.AssistantCommissionRate,
                TechnicianCommissionRate = request.TechnicianCommissionRate,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = currentUserId,
            };
            return await _procedureRepository.CreateProcedure(procedure);
        }
    }
}
