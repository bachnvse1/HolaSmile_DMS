using HDMS_API.Application.Usecases.UserCommon.Login;
using MediatR;

namespace Application.Usecases.UserCommon.RefreshToken;
    public class RefreshTokenCommand : IRequest<LoginResultDto>
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }

        public RefreshTokenCommand(string accessToken, string refreshToken)
        {
            AccessToken = accessToken;
            RefreshToken = refreshToken;
        }
    }