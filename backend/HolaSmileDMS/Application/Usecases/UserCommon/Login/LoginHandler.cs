using Application.Constants;
using Application.Interfaces;
using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.Login
{
    public class LoginHandler : IRequestHandler<LoginCommand, LoginResultDto>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtService _jwtService;

        public LoginHandler(IUserCommonRepository userCommonRepository, IPasswordHasher passwordHasher, IJwtService jwtService)
        {
            _jwtService = jwtService;
            _userCommonRepository = userCommonRepository;
            _passwordHasher = passwordHasher;
        }

        public async Task<LoginResultDto> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            // Lấy thông tin người dùng từ username
            var user = await _userCommonRepository.GetByUsernameAsync(request.Username, cancellationToken);

            // Kiểm tra user không tồn tại hoặc bị vô hiệu hóa
            if (user == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG01); // Sai tên đăng nhập hoặc mật khẩu
            }

            if (user.Status == false)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG72); // Tài khoản của bạn đã bị khóa
            }

            // Xác minh mật khẩu
            var isPasswordValid = _passwordHasher.Verify(request.Password, user.Password);
            if (!isPasswordValid)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG01); // Sai mật khẩu
            }

            // Lấy role của người dùng
            var userRole = await _userCommonRepository.GetUserRoleAsync(user.Username, cancellationToken);

            // Tạo access token và refresh token
            var accessToken = _jwtService.GenerateJWTToken(user, userRole.Role, userRole.RoleTableId);
            var refreshToken = _jwtService.GenerateRefreshToken(user.UserID.ToString());

            // Trả về kết quả đăng nhập thành công
            return new LoginResultDto
            {
                Success = true,
                Token = accessToken,
                refreshToken = refreshToken,
                Role = userRole.Role
            };
        }
    }
}
