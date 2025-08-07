using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Common.Helpers;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace HDMS_API.Application.Usecases.UserCommon.EditProfile
{
    public class EditProfileHandler : IRequestHandler<EditProfileCommand, bool>
    {
        private readonly IUserCommonRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICloudinaryService _cloudinaryService;

        public EditProfileHandler(
            IUserCommonRepository repository,
            IHttpContextAccessor httpContextAccessor,
            ICloudinaryService cloudinaryService)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<bool> Handle(EditProfileCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var currentUser = await _repository.GetByIdAsync(currentUserId, cancellationToken);
            if (currentUser == null)
                throw new Exception(MessageConstants.MSG.MSG16);

            if (!string.IsNullOrWhiteSpace(request.DOB) && FormatHelper.TryParseDob(request.DOB) == null)
                throw new Exception(MessageConstants.MSG.MSG34);

            currentUser.Fullname = request.Fullname ?? currentUser.Fullname;
            currentUser.Gender = request.Gender ?? currentUser.Gender;
            currentUser.Address = request.Address ?? currentUser.Address;
            currentUser.DOB = FormatHelper.TryParseDob(request.DOB) ?? currentUser.DOB;
            currentUser.Email = request.Email ?? currentUser.Email;
            if (request.Avatar != null && request.Avatar.Length > 0)
            {
                var avatarUrl = await _cloudinaryService.UploadImageAsync(request.Avatar, "avatars");
                currentUser.Avatar = avatarUrl; // lưu URL vào DB
            }


            currentUser.UpdatedAt = DateTime.UtcNow;

            var success = await _repository.EditProfileAsync(currentUser, cancellationToken);
            if (!success)
                throw new Exception(MessageConstants.MSG.MSG58);

            return true;
        }
    }
}
