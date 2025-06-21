using HDMS_API.Application.Common.Helpers;
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

            var currentUser = await _repository.GetByIdAsync(currentUserId, cancellationToken);
            if (user == null)
                throw new Exception("Người dùng không tồn tại.");

            if (!string.IsNullOrWhiteSpace(request.Phone) && !FormatHelper.FormatPhoneNumber(request.Phone))
                throw new Exception("Số điện thoại không hợp lệ.");

            if (!string.IsNullOrWhiteSpace(request.Email) && !FormatHelper.IsValidEmail(request.Email))
                throw new Exception("Email không hợp lệ.");

            if (!string.IsNullOrWhiteSpace(request.DOB) && FormatHelper.TryParseDob(request.DOB) == null)
                throw new Exception("Ngày sinh không hợp lệ.");

            currentUser.Fullname = request.Fullname ?? currentUser.Fullname;
            currentUser.Gender = request.Gender ?? currentUser.Gender;
            currentUser.Address = request.Address ?? currentUser.Address;
            currentUser.DOB = FormatHelper.TryParseDob(request.DOB) ?? currentUser.DOB;
            currentUser.Phone = request.Phone ?? currentUser.Phone;
            currentUser.Email = request.Email ?? currentUser.Email;
            currentUser.Avatar = request.Avatar ?? currentUser.Avatar;
            currentUser.UpdatedAt = DateTime.UtcNow;

            return await _repository.EditProfileAsync(currentUser, cancellationToken);
        }
    }
}
