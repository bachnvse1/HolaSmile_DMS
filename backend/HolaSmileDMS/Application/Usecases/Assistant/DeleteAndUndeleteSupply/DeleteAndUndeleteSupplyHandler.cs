using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.DeleteAndUndeleteSupply
{
    public class DeleteAndUndeleteSupplyHandler : IRequestHandler<DeleteAndUndeleteSupplyCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;
        public DeleteAndUndeleteSupplyHandler(IHttpContextAccessor httpContextAccessor, ISupplyRepository supplyRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _supplyRepository = supplyRepository;
        }
        public async Task<bool> Handle(DeleteAndUndeleteSupplyCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }
            var existingSupply = await _supplyRepository.GetSupplyBySupplyIdAsync(request.SupplyId);
            if (existingSupply == null)
            {
                throw new ArgumentException(MessageConstants.MSG.MSG16);
            }

            existingSupply.IsDeleted = !existingSupply.IsDeleted; // Toggle the IsDeleted status
            existingSupply.UpdatedAt = DateTime.Now;
            existingSupply.UpdatedBy = currentUserId;
            return await _supplyRepository.EditSupplyAsync(existingSupply);
        }
    }
}
