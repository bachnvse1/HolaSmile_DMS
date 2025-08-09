using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Common.Helpers;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace HDMS_API.Application.Usecases.UserCommon.EditProfile
{
    public class EditProfileHandler : IRequestHandler<EditProfileCommand, bool>
    {
        private readonly IUserCommonRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IMemoryCache _cache; // ✅ thêm cache

        public EditProfileHandler(
            IUserCommonRepository repository,
            IHttpContextAccessor httpContextAccessor,
            ICloudinaryService cloudinaryService,
            IMemoryCache cache) // ✅ inject
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _cloudinaryService = cloudinaryService;
            _cache = cache; // ✅
        }

        public async Task<bool> Handle(EditProfileCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var currentUser = await _repository.GetByIdAsync(currentUserId, cancellationToken);
            if (currentUser == null)
                throw new Exception(MessageConstants.MSG.MSG16);

            // Validate DOB nếu có
            if (!string.IsNullOrWhiteSpace(request.DOB) && FormatHelper.TryParseDob(request.DOB) == null)
                throw new Exception(MessageConstants.MSG.MSG34);

            // ====== ĐỔI EMAIL: BẮT BUỘC CÓ TOKEN TỪ VERIFY OTP ======
            if (!string.IsNullOrWhiteSpace(request.Email) &&
                !string.Equals(request.Email, currentUser.Email, StringComparison.OrdinalIgnoreCase))
            {
                // 1) Kiểm tra token
                if (string.IsNullOrWhiteSpace(request.ChangeEmailToken))
                    throw new Exception("Thiếu mã xác nhận đổi email. Vui lòng xác thực OTP trước.");

                // 2) Lấy payload từ cache và kiểm tra khớp
                var cacheKey = $"change-email-token:{request.ChangeEmailToken}";
                if (!_cache.TryGetValue(cacheKey, out dynamic payload))
                    throw new Exception(MessageConstants.MSG.MSG79); // token hết hạn/không hợp lệ

                int tokenUserId = (int)payload.UserId;
                string tokenNewEmail = (string)payload.NewEmail;

                if (tokenUserId != currentUserId ||
                    !string.Equals(tokenNewEmail, request.Email, StringComparison.OrdinalIgnoreCase))
                    throw new Exception("Token xác nhận không khớp với yêu cầu đổi email.");

                // 3) Double-check email chưa bị đăng ký trong lúc chờ
                var existingUser = await _repository.GetUserByEmailAsync(request.Email);
                if (existingUser != null)
                    throw new Exception("Email này đã tồn tại");

                // 4) Xoá token ngay sau khi dùng
                _cache.Remove(cacheKey);
            }
            // =========================================================

            // Map các field khác
            currentUser.Fullname = request.Fullname ?? currentUser.Fullname;
            currentUser.Gender = request.Gender ?? currentUser.Gender;
            currentUser.Address = request.Address ?? currentUser.Address;
            currentUser.DOB = FormatHelper.TryParseDob(request.DOB) ?? currentUser.DOB;
            currentUser.Email = request.Email ?? currentUser.Email;

            if (request.Avatar != null && request.Avatar.Length > 0)
            {
                var avatarUrl = await _cloudinaryService.UploadImageAsync(request.Avatar, "avatars");
                currentUser.Avatar = avatarUrl;
            }

            currentUser.UpdatedAt = DateTime.UtcNow;

            var success = await _repository.EditProfileAsync(currentUser, cancellationToken);
            if (!success)
                throw new Exception(MessageConstants.MSG.MSG58);

            return true;
        }
    }
}
