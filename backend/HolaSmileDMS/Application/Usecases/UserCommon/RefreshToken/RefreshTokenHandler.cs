using System.Security.Claims;
using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.Login;
using MediatR;
using Microsoft.IdentityModel.Tokens;

namespace Application.Usecases.UserCommon.RefreshToken;

public class RefreshTokenHandler : IRequestHandler<RefreshTokenCommand, LoginResultDto>
{
    private readonly IJwtService _jwtService;
    private readonly IUserCommonRepository _userCommonRepository;

    public RefreshTokenHandler(IJwtService jwtService, IUserCommonRepository userCommonRepository)
    {
        _jwtService = jwtService;
        _userCommonRepository = userCommonRepository;
    }

    public async Task<LoginResultDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var refreshPrincipal = _jwtService.GetPrincipalFromExpiredToken(request.RefreshToken, true);
        if (refreshPrincipal == null)
            throw new SecurityTokenException("Invalid refresh token");

        var userId = refreshPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var accessPrincipal = _jwtService.GetPrincipalFromExpiredToken(request.AccessToken, false);
        if (accessPrincipal == null || userId != accessPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value)
            throw new SecurityTokenException("Access token and refresh token do not match");

        var claims = accessPrincipal.Claims.ToList();
        User user = await _userCommonRepository.GetByUsernameAsync(claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value, cancellationToken);
        var userRole = await _userCommonRepository.GetUserRoleAsync(user.Username, cancellationToken);

        var newAccessToken = _jwtService.GenerateJWTToken(user, userRole.Role, userRole.RoleTableId);
        var newRefreshToken = _jwtService.GenerateRefreshToken(userId!);

        return new LoginResultDto
        {
            Success = true,
            Token = newAccessToken,
            refreshToken = newRefreshToken,
            Role = userRole.Role
        };
    }
}