using Application.Interfaces;
using MediatR;

namespace Application.Usecases.Guests.ViewAllGuestCommand;

public class ViewAllUsersChatHandler : IRequestHandler<ViewAllGuestsChatCommand, List<GuestChatDto>>
{
    private readonly IGuestRepository _guestRepository;

    public ViewAllUsersChatHandler(IGuestRepository guestRepository)
    {
        _guestRepository = guestRepository;
    }

    public async Task<List<GuestChatDto>> Handle(ViewAllGuestsChatCommand request, CancellationToken cancellationToken)
    {
        return await _guestRepository.GetAllGuestsAsync();
    }
}