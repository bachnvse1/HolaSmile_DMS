using Application.Interfaces;
using MediatR;

namespace Application.Usecases.SendNotification;

public class SendNotificationHandler : IRequestHandler<SendNotificationCommand, Unit>
{
    private readonly INotificationsRepository _repo;
    private readonly IUserCommonRepository _userRepo;
    
    public SendNotificationHandler(INotificationsRepository repo, IUserCommonRepository userRepo) {
        _repo = repo;
        _userRepo = userRepo;
    }

    public async Task<Unit> Handle(SendNotificationCommand c, CancellationToken ct)
    {
        var userExists = await _userRepo.GetByIdAsync(c.UserId, ct);
        if (userExists == null)
            throw new KeyNotFoundException($"UserId {c.UserId} không tồn tại.");
        var entity = new Notification
        {
            UserId          = c.UserId,
            Title           = c.Title,
            Message         = c.Message,
            Type            = c.Type,
            IsRead          = false,
            CreatedAt       = DateTime.UtcNow,
            RelatedObjectId = c.RelatedObjectId
        };

        await _repo.SendNotificationAsync(entity, ct);
        return Unit.Value;
    }
}