using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Administrator.ViewListUser
{
    public class ViewListUserHandler : IRequestHandler<ViewListUserCommand, List<ViewListUserDTO>>
    {

        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ViewListUserHandler(IUserCommonRepository userCommonRepository, IHttpContextAccessor httpContextAccessor )
        {
            _userCommonRepository = userCommonRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<List<ViewListUserDTO>> Handle(ViewListUserCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "administrator", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            var listUsers = await _userCommonRepository.GetAllUserAsync();
            if(listUsers == null || !listUsers.Any())
            {
                throw new Exception(MessageConstants.MSG.MSG16);
            }
            return listUsers;
        }
    }
}
