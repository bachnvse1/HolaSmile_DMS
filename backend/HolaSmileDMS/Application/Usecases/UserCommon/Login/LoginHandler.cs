using Application.Constants;
using Application.Constants.Interfaces;
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
            var user = await _userCommonRepository.GetByUsernameAsync(request.Username, cancellationToken);

            // Nếu không tìm thấy user hoặc tài khoản bị vô hiệu hoá
            if (user == null || user.Status == false)
            {
                throw new UnauthorizedAccessException(
                    user == null
                        ? MessageConstants.MSG.MSG01 // Sai tên đăng nhập hoặc mật khẩu
                        : MessageConstants.MSG.MSG72 // Tài khoản của bạn đã bị khóa
                );
            }

            var isPasswordValid = _passwordHasher.Verify(request.Password, user.Password);
            if (!isPasswordValid)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG01);
            }

            var role = await _userCommonRepository.GetUserRoleAsync(user.Username, cancellationToken);
            var token = _jwtService.GenerateJWTToken(user, role);
            var refreshToken = _jwtService.GenerateRefreshToken(user.UserID.ToString());

            return new LoginResultDto
            {
                Success = true,
                Token = token,
                refreshToken = refreshToken,
                Role = role
            };
        }
    }
}
