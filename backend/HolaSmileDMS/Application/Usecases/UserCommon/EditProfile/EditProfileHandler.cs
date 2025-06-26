using Application.Constants;
using Application.Interfaces;
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

            var currentUser = await _repository.GetByIdAsync(currentUserId, cancellationToken);
            if (currentUser == null)
                throw new Exception(MessageConstants.MSG.MSG16); // "Không có dữ liệu phù hợp"

            if (!string.IsNullOrWhiteSpace(request.DOB) && FormatHelper.TryParseDob(request.DOB) == null)
                throw new Exception(MessageConstants.MSG.MSG34); // "Ngày bắt đầu không được sau ngày kết thúc" (nếu dùng cho DOB sai, bạn có thể thêm MSG77 = "Ngày sinh không hợp lệ")

            currentUser.Fullname = request.Fullname ?? currentUser.Fullname;
            currentUser.Gender = request.Gender ?? currentUser.Gender;
            currentUser.Address = request.Address ?? currentUser.Address;
            currentUser.DOB = FormatHelper.TryParseDob(request.DOB) ?? currentUser.DOB;
            currentUser.Avatar = request.Avatar ?? currentUser.Avatar;
            currentUser.UpdatedAt = DateTime.Now;

            var success = await _repository.EditProfileAsync(currentUser, cancellationToken);
            if (!success)
                throw new Exception(MessageConstants.MSG.MSG58); // "Cập nhật dữ liệu thất bại"

            return true;
        }


    }
}
