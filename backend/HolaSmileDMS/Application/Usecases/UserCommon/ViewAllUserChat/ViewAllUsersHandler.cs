using Application.Interfaces;
using MediatR;

namespace Application.Usecases.UserCommon.ViewAllUserChat;

public class ViewAllUsersHandler : IRequestHandler<ViewAllUsersChatCommand, List<ViewUserChatDto>>
{
    private readonly IUserCommonRepository _userRepository;

    public ViewAllUsersHandler(IUserCommonRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<ViewUserChatDto>> Handle(ViewAllUsersChatCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllUserAsync();

        return users.Select(u => new ViewUserChatDto()
        {
            UserId = u.UserId.ToString(),
            FullName = u.FullName,
            Phone = u.PhoneNumber,
            AvatarUrl = u.ImageUrl,
            Role = u.Role,
        }).ToList();
    }
}
