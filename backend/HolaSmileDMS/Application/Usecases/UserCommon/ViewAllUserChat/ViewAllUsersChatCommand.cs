using MediatR;

namespace Application.Usecases.UserCommon.ViewAllUserChat;

public class ViewAllUsersChatCommand : IRequest<List<ViewUserChatDto>>
{
}
