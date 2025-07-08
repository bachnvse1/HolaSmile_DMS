using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistant.DeactiveWarrantyCard
{
    public class DeactiveWarrantyCardHandler : IRequestHandler<DeactiveWarrantyCardCommand, string>
    {
        private readonly IWarrantyCardRepository _warrantyRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeactiveWarrantyCardHandler(
            IWarrantyCardRepository warrantyRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _warrantyRepository = warrantyRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(DeactiveWarrantyCardCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17); // Phiên làm việc đã hết hạn

            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (role != "Assistant")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền truy cập

            var warrantyCard = await _warrantyRepository.GetByIdAsync(request.WarrantyCardId, cancellationToken);
            if (warrantyCard == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG103); // Thẻ bảo hành không tồn tại

            if (warrantyCard.Status == false)
                throw new InvalidOperationException(MessageConstants.MSG.MSG104); // Thẻ bảo hành đã bị vô hiệu hóa

            warrantyCard.Status = false;
            warrantyCard.UpdatedAt = DateTime.Now;
            warrantyCard.UpdatedBy = int.TryParse(userId, out var uid) ? uid : null;

            var result = await _warrantyRepository.DeactiveWarrantyCardAsync(warrantyCard, cancellationToken);
            if (!result)
                throw new Exception(MessageConstants.MSG.MSG58); // Cập nhật thất bại

            return MessageConstants.MSG.MSG105; // Vô hiệu hóa thẻ bảo hành thành công
        }
    }
}
