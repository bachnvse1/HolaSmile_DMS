using MediatR;

namespace Application.Usecases.Guests.ViewAllGuestCommand;

public class ViewAllGuestsChatCommand : IRequest<List<GuestChatDto>>
{
}