using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistant.EditWarrantyCard
{
    public class EditWarrantyCardHandler : IRequestHandler<EditWarrantyCardCommand, string>
    {
        private readonly IWarrantyCardRepository _warrantyRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditWarrantyCardHandler(
            IWarrantyCardRepository warrantyRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _warrantyRepository = warrantyRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(EditWarrantyCardCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);

            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (role != "Assistant" && role != "Dentist" && role != "Receptionist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var card = await _warrantyRepository.GetByIdAsync(request.WarrantyCardId, cancellationToken);
            if (card == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG102);

            // Validate Duration (thay vì Term)
            if (!request.Duration.HasValue || request.Duration <= 0)
                throw new FormatException(MessageConstants.MSG.MSG98); // "Định dạng kỳ hạn không hợp lệ"

            card.Duration = request.Duration;
            card.EndDate = card.StartDate.AddMonths(request.Duration.Value); // Tính lại ngày kết thúc
            card.Status = request.Status;
            card.UpdatedAt = DateTime.Now;
            card.UpdatedBy = int.TryParse(userId, out var uid) ? uid : null;

            await _warrantyRepository.UpdateWarrantyCardAsync(card, cancellationToken);

            return MessageConstants.MSG.MSG106; // Cập nhật thẻ bảo hành thành công
        }
    }
}
