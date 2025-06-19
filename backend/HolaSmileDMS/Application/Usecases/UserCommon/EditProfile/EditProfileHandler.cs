using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace HDMS_API.Application.Usecases.UserCommon.EditProfile
{
    public class EditProfileHandler : IRequestHandler<EditProfileCommand, bool>
    {
        private readonly IUserCommonRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditProfileHandler(
            IUserCommonRepository repository,
            IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> Handle(EditProfileCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;

            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var isAuthorized = currentUserId == request.UserId;

            if (!isAuthorized)
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa hồ sơ người dùng này.");

            return await _repository.EditProfileAsync(request, cancellationToken);
        }
    }
}
