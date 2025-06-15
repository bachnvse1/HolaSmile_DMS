using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.Login
{
    public class LoginHandler : IRequestHandler<LoginCommand, LoginResultDto>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUserRoleChecker _userRoleChecker;
        private readonly IJwtService _jwtService;
        public LoginHandler(IUserCommonRepository userCommonRepository, IPasswordHasher passwordHasher, IUserRoleChecker userRoleChecker, IJwtService jwtService) {
        
            _jwtService = jwtService;
            _userCommonRepository = userCommonRepository;
            _passwordHasher = passwordHasher;
            _userRoleChecker = userRoleChecker;
        }
        public async Task<LoginResultDto> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            var user = await _userCommonRepository.GetByUsernameAsync(request.Username, cancellationToken);
            if (user == null || user.Status == false)
            {
                throw new UnauthorizedAccessException("Invalid credentials.");
            }

            var isPasswordValid = _passwordHasher.Verify(request.Password, user.Password);
            if (!isPasswordValid)
            {
                throw new UnauthorizedAccessException("Invalid credentials.");
            }

            var role = await _userRoleChecker.GetUserRoleAsync(user.Username, cancellationToken);
            var token = _jwtService.GenerateJWTToken(user, role);

            return new LoginResultDto
            {
                Success = true,
                Token = token,
                Role = role
            };
        }
    }
}
