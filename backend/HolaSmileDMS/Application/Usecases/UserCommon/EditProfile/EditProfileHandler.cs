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
        private readonly IFileStorageService _fileStorageService;

        public EditProfileHandler(
            IUserCommonRepository repository,
            IHttpContextAccessor httpContextAccessor,
            IFileStorageService fileStorageService)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _fileStorageService = fileStorageService;
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
            if (!string.IsNullOrEmpty(request.Avatar) && File.Exists(request.Avatar))
            {
                currentUser.Avatar = _fileStorageService.SaveAvatar(request.Avatar);
            }

            currentUser.UpdatedAt = DateTime.UtcNow;

            var success = await _repository.EditProfileAsync(currentUser, cancellationToken);
            if (!success)
                throw new Exception(MessageConstants.MSG.MSG58);

            return true;
        }
    }
}
