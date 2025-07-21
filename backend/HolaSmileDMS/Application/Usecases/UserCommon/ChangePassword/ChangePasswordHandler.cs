using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Common.Helpers;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.UserCommon.ChangePassword;

public class ChangePasswordHandler : IRequestHandler<ChangePasswordCommand, string>
{
    private readonly IUserCommonRepository _userRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordHandler(
        IUserCommonRepository userRepository,
        IHttpContextAccessor httpContextAccessor,
        IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _httpContextAccessor = httpContextAccessor;
        _passwordHasher = passwordHasher;
    }

    public async Task<string> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        // Kiểm tra người dùng đã đăng nhập
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);

        var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (userId <= 0)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        // Validate dữ liệu đầu vào
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmPassword))
            throw new ArgumentException(MessageConstants.MSG.MSG07);

        // Kiểm tra định dạng mật khẩu mới sử dụng FormatHelper
        if (!FormatHelper.IsValidPassword(request.NewPassword))
            throw new ArgumentException(MessageConstants.MSG.MSG02);

        // Kiểm tra xác nhận mật khẩu
        if (request.NewPassword != request.ConfirmPassword)
            throw new ArgumentException(MessageConstants.MSG.MSG43); // Mật khẩu mới và xác nhận không khớp

        // Lấy thông tin user từ database
        var userEntity = await _userRepository.GetByIdAsync(userId, cancellationToken);

        if (userEntity == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        // Kiểm tra mật khẩu hiện tại
        if (!_passwordHasher.Verify(request.CurrentPassword, userEntity.Password))
            throw new ArgumentException(MessageConstants.MSG.MSG24);

        // Cập nhật mật khẩu mới
        userEntity.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        userEntity.UpdatedAt = DateTime.Now;

        await _userRepository.EditProfileAsync(userEntity, cancellationToken);

        return MessageConstants.MSG.MSG10; // Đổi mật khẩu thành công
    }
}