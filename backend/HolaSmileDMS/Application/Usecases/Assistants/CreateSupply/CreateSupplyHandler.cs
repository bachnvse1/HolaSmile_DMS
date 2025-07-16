using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.CreateSupply
{
    public class CreateSupplyHandler : IRequestHandler<CreateSupplyCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;
        public CreateSupplyHandler(IHttpContextAccessor httpContextAccessor, ISupplyRepository supplyRepository) 
        {
            _httpContextAccessor = httpContextAccessor;
            _supplyRepository = supplyRepository;
        }
        public async Task<bool> Handle(CreateSupplyCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."
            }

            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Bạn không có quyền truy cập chức năng này
            }

            if (string.IsNullOrEmpty(request.SupplyName.Trim()))
            {
                throw new ArgumentException(MessageConstants.MSG.MSG07); // Vui lòng nhập thông tin bắt buộc
            }
            if (string.IsNullOrEmpty(request.Unit.Trim()))
            {
                throw new ArgumentException(MessageConstants.MSG.MSG07);
            }
            if (request.QuantityInStock <= 0)
            {
                throw new ArgumentException(MessageConstants.MSG.MSG94); // Số lượng trong kho không được nhỏ hơn 0
            }
            if(request.Price <= 0)
            {
                throw new ArgumentException(MessageConstants.MSG.MSG95); // Giá không được nhỏ hơn 0
            }
            if(request.ExpiryDate < DateTime.Now)
            {
                throw new ArgumentException(MessageConstants.MSG.MSG96); // Ngày hết hạn không được trước ngày hiện tại
            }
            var newSupply = new Supplies
            {
                Name = request.SupplyName.Trim(),
                Unit = request.Unit,
                QuantityInStock = request.QuantityInStock,
                Price = Math.Round(request.Price, 2),
                ExpiryDate = request.ExpiryDate,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDeleted = false
            };

            var isCreated = await _supplyRepository.CreateSupplyAsync(newSupply);
            return isCreated;
        }
    }
}
