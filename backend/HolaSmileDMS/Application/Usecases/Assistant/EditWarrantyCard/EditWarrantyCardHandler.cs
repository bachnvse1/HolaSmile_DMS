using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Common.Helpers;
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

            if (role != "Assistant")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var card = await _warrantyRepository.GetByIdAsync(request.WarrantyCardId, cancellationToken);
            if (card == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG102);

            DateTime newEndDate;
            try
            {
                newEndDate = FormatHelper.ParseEndDateFromTerm(card.StartDate, request.Term);
            }
            catch
            {
                throw new FormatException(MessageConstants.MSG.MSG98);
            }

            card.Term = request.Term;
            card.EndDate = newEndDate;
            card.Status = request.Status;
            card.UpdatedAt = DateTime.Now;
            card.UpdatedBy = int.TryParse(userId, out var uid) ? uid : null;

            await _warrantyRepository.UpdateWarrantyCardAsync(card, cancellationToken);

            return MessageConstants.MSG.MSG106; // Cập nhật thẻ bảo hành thành công
        }
    }
}
