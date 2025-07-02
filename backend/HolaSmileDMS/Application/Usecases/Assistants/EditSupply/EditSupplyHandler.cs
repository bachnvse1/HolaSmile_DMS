using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistants.EditSupply
{
    public class EditSupplyHandler : IRequestHandler<EditSupplyCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;
        public EditSupplyHandler(IHttpContextAccessor httpContextAccessor, ISupplyRepository supplyRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _supplyRepository = supplyRepository;
        }

        public async Task<bool> Handle(EditSupplyCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập chức năng này");
            }
            if (string.IsNullOrEmpty(request.SupplyName?.Trim()))
            {
                throw new ArgumentException("Vui lòng nhập thông tin bắt buộc");
            }
            if (string.IsNullOrEmpty(request.Unit?.Trim()))
            {
                throw new ArgumentException("Vui lòng nhập thông tin bắt buộc");
            }
            if (request.QuantityInStock < 0)
            {
                throw new ArgumentException("Số lượng trong kho không được nhỏ hơn 0");
            }
            if (request.Price <= 0)
            {
                throw new ArgumentException("Giá không được nhỏ hơn 0");
            }
            if (request.ExpiryDate < DateTime.Now)
            {
                throw new ArgumentException("Ngày hết hạn không được trước ngày hiện tại");
            }

            var existSupply = await _supplyRepository.GetSupplyBySupplyIdAsync(request.SupplyId);
            if(existSupply == null)
            {
                throw new ArgumentException(MessageConstants.MSG.MSG16);
            }

            existSupply.Name = request.SupplyName;
            existSupply.Unit = request.Unit;
            existSupply.QuantityInStock = request.QuantityInStock;
            existSupply.Price = Math.Round(request.Price, 2);
            existSupply.ExpiryDate = request.ExpiryDate;
            existSupply.UpdatedAt = DateTime.Now;
            existSupply.UpdatedBy = currentUserId;

            return await _supplyRepository.EditSupplyAsync(existSupply);
        }
    }
}
