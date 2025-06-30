using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Application.Usecases.Administrator.BanAndUnban;

namespace Application.Usecases.administrator.BanAndUnban
{
    public class BanAndUnbanUserHandle : IRequestHandler<BanAndUnbanUserCommand, bool>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public BanAndUnbanUserHandle(IUserCommonRepository userCommonRepository, IHttpContextAccessor httpContextAccessor)
        {
            _userCommonRepository = userCommonRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> Handle(BanAndUnbanUserCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "administrator", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }


            // Kiểm tra dữ liệu đầu vào
            if (request.UserId <= 0)
            {
                throw new ArgumentException("dữ liệu đầu vào không đúng");
            }
            var isChangeStatus = await _userCommonRepository.UpdateUserStatusAsync(request.UserId);
            return isChangeStatus;
        }
    }
}