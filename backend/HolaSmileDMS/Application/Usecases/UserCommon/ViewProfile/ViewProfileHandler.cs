using System.Threading;
using System.Threading.Tasks;
using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Interfaces;
using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.ViewProfile
{
    public class ViewProfileHandler : IRequestHandler<ViewProfileCommand, ViewProfileDto?>
    {
        private readonly IUserCommonRepository _userRepository;

        public ViewProfileHandler(IUserCommonRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<ViewProfileDto?> Handle(ViewProfileCommand request, CancellationToken cancellationToken)
        {
            var userProfile = await _userRepository.GetUserProfileAsync(request.UserId, cancellationToken);

            return userProfile;
        }
    }
}
